// src/context/SessionContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface SessionData {
  id: string; 
  userId: string;
  topic: string;
  startTime: number;
  endTime: number | null;
  emotions: { emotion: string; timestamp: number; duration?: number }[];
  actions: { type: string; emotion: string; timestamp: number }[];
  effectivenessScore?: number;
  finalEmotionProbabilities?: number[];
  createdAt?: string;
  updatedAt?: string;
}

interface SessionContextType {
  currentSession: SessionData | null;
  pastSessions: SessionData[];
  startSession: (topic: string) => void;
  endSession: (options?: { finalEmotionProbabilities?: number[] }) => SessionData | null;
  recordEmotion: (emotion: string) => void;
  recordAction: (actionType: string, emotion: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [pastSessions, setPastSessions] = useState<SessionData[]>([]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user || !user._id) {
        setPastSessions([]);
        return;
      }
      try {
        console.log('Fetching past sessions for user:', user._id);
        const response = await fetch(`${BASE_URL}/api/sessions`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch sessions: ${response.statusText} - ${errorData.message || ''}`);
        }
        const data: SessionData[] = await response.json();
        const formattedSessions = data.map(session => ({ ...session, id: session._id || session.id }));
        setPastSessions(formattedSessions);
      } catch (error) {
        console.error('Error fetching past sessions:', error);
      }
    };

    fetchSessions();
  }, [user, getAuthHeaders]);

  const startSession = (topic: string) => {
    if (!user || !user._id) {
      console.error("Cannot start session: User not logged in.");
      return;
    }
    const newSession: SessionData = {
      id: Date.now().toString(),
      userId: user._id,
      topic,
      startTime: Date.now(),
      endTime: null,
      emotions: [],
      actions: [],
      effectivenessScore: 0,
      finalEmotionProbabilities: [0, 0, 0, 0],
    };
    setCurrentSession(newSession);
  };

  const endSession = (options?: { finalEmotionProbabilities?: number[] }): SessionData | null => {
    if (!currentSession || !user || !user._id) {
      console.warn("No active session or user logged in to end.");
      return null;
    }

    const sessionEndTime = Date.now();
    const completedSession: SessionData = {
      ...currentSession,
      endTime: sessionEndTime,
      finalEmotionProbabilities: options?.finalEmotionProbabilities || currentSession.finalEmotionProbabilities,
    };

    completedSession.effectivenessScore = calculateEffectivenessScore(completedSession.finalEmotionProbabilities);

    const saveSession = async () => {
      try {
        console.log('Attempting to save session to backend:', completedSession);
        const response = await fetch(`${BASE_URL}/api/sessions`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(completedSession),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to save session: ${response.statusText} - ${errorData.message || ''}`);
        }
        const savedSession: SessionData = await response.json();
        console.log('Session saved successfully to DB:', savedSession);
        setPastSessions((prev) => [{ ...savedSession, id: savedSession._id || savedSession.id }, ...prev]);
      } catch (error) {
        console.error('Error saving session:', error);
      } finally {
        setCurrentSession(null);
      }
    };

    saveSession();
    return completedSession;
  };

  const recordEmotion = (emotion: string) => {
    setCurrentSession((prev) => {
      if (!prev) return null;
      const updatedEmotions = [...prev.emotions, { emotion, timestamp: Date.now() }];
      return { ...prev, emotions: updatedEmotions };
    });
  };

  const recordAction = (actionType: string, emotion: string) => {
    // Reverted: Removed console log for recordAction
    setCurrentSession((prev) => {
      if (!prev) return null;
      const updatedActions = [...prev.actions, { type: actionType, emotion, timestamp: Date.now() }];
      return { ...prev, actions: updatedActions };
    });
  };

  const calculateEffectivenessScore = useCallback((finalProbs?: number[]): number => {
    if (!finalProbs || finalProbs.length !== 4) {
      console.warn("Invalid finalProbs for effectiveness score calculation:", finalProbs);
      return 0;
    }

    const boredomProb = finalProbs[0] || 0;
    const confusionProb = finalProbs[1] || 0;
    const fatigueProb = finalProbs[2] || 0;
    const focusProb = finalProbs[3] || 0;

    // Reverted: Removed console logs for effectiveness score debugging
    // You can re-add them if you need to debug the score calculation itself,
    // but they are not directly related to the PayloadTooLargeError.

    const weightFocus = 100;
    const weightBoredom = 50;
    const weightConfusion = 70;
    const weightFatigue = 80;

    const positiveContribution = focusProb * weightFocus;
    const negativeContribution = (boredomProb * weightBoredom) + 
                                 (confusionProb * weightConfusion) + 
                                 (fatigueProb * weightFatigue);

    let rawScore = positiveContribution - negativeContribution;

    const clampedScore = Math.max(0, Math.min(100, rawScore));
    const finalRoundedScore = Math.round(clampedScore);

    return finalRoundedScore;
  }, []);

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        pastSessions,
        startSession,
        endSession,
        recordEmotion,
        recordAction,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};
