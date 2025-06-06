import React, { createContext, useState, useContext, useEffect } from 'react';
import { EmotionType } from './EmotionContext';

export type EmotionRecord = {
  emotion: EmotionType;
  timestamp: number;
  duration: number;
};

export type ActionRecord = {
  type: string;
  emotion: EmotionType;
  timestamp: number;
};

export type SessionData = {
  id: string;
  topic: string;
  startTime: number;
  endTime: number | null;
  emotions: EmotionRecord[];
  actions: ActionRecord[];
  effectivenessScore: number | null;
};

type SessionContextType = {
  currentSession: SessionData | null;
  pastSessions: SessionData[];
  startSession: (topic: string) => void;
  endSession: () => SessionData;
  recordEmotion: (emotion: EmotionType) => void;
  recordAction: (type: string, emotion: EmotionType) => void;
  getSessionById: (id: string) => SessionData | undefined;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [pastSessions, setPastSessions] = useState<SessionData[]>(() => {
    const saved = localStorage.getItem('pastSessions');
    return saved ? JSON.parse(saved) : [];
  });

  // Save past sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pastSessions', JSON.stringify(pastSessions));
  }, [pastSessions]);

  const startSession = (topic: string) => {
    const newSession: SessionData = {
      id: `session-${Date.now()}`,
      topic,
      startTime: Date.now(),
      endTime: null,
      emotions: [],
      actions: [],
      effectivenessScore: null
    };
    setCurrentSession(newSession);
  };

  const calculateEffectivenessScore = (session: SessionData): number => {
    // This is a simplified score calculation
    // In a real app, this would be more sophisticated based on:
    // - Time spent in focused state vs other states
    // - Actions taken during different emotional states
    // - Completion of content vs distractions
    
    let focusTime = 0;
    let totalTime = session.endTime! - session.startTime;
    
    session.emotions.forEach(record => {
      if (record.emotion === 'focus') {
        focusTime += record.duration;
      }
    });
    
    // Calculate percentage of time spent focused (0-100)
    const focusPercentage = (focusTime / totalTime) * 100;
    
    // Factor in actions - more actions could indicate more engagement
    const actionFactor = Math.min(session.actions.length / 5, 1) * 20; // Max 20 points
    
    // Calculate final score (0-100)
    return Math.min(Math.round((focusPercentage * 0.8) + actionFactor), 100);
  };

  const endSession = () => {
    if (!currentSession) throw new Error('No active session');
    
    const completedSession: SessionData = {
      ...currentSession,
      endTime: Date.now()
    };
    
    // Calculate effectiveness score
    completedSession.effectivenessScore = calculateEffectivenessScore(completedSession);
    
    // Add to past sessions
    setPastSessions(prev => [completedSession, ...prev]);
    
    // Clear current session
    setCurrentSession(null);
    
    return completedSession;
  };

  const recordEmotion = (emotion: EmotionType) => {
    if (!currentSession) return;
    
    const now = Date.now();
    const lastEmotion = currentSession.emotions[currentSession.emotions.length - 1];
    
    // Update previous emotion's duration
    let updatedEmotions = [...currentSession.emotions];
    if (lastEmotion) {
      updatedEmotions[updatedEmotions.length - 1] = {
        ...lastEmotion,
        duration: now - lastEmotion.timestamp
      };
    }
    
    // Add new emotion record
    updatedEmotions.push({
      emotion,
      timestamp: now,
      duration: 0 // Will be updated when the next emotion is recorded
    });
    
    setCurrentSession(prev => prev ? {
      ...prev,
      emotions: updatedEmotions
    } : null);
  };

  const recordAction = (type: string, emotion: EmotionType) => {
    if (!currentSession) return;
    
    const newAction: ActionRecord = {
      type,
      emotion,
      timestamp: Date.now()
    };
    
    setCurrentSession(prev => prev ? {
      ...prev,
      actions: [...prev.actions, newAction]
    } : null);
  };

  const getSessionById = (id: string) => {
    return pastSessions.find(session => session.id === id);
  };

  return (
    <SessionContext.Provider 
      value={{ 
        currentSession, 
        pastSessions, 
        startSession, 
        endSession, 
        recordEmotion, 
        recordAction,
        getSessionById
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};