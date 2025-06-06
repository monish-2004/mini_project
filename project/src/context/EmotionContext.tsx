import React, { createContext, useState, useContext, useEffect } from 'react';

// Define emotion types
export type EmotionType = 'boredom' | 'confusion' | 'fatigue' | 'focus' | null;

type EmotionContextType = {
  currentEmotion: EmotionType;
  showEmotionAction: boolean;
  setCurrentEmotion: (emotion: EmotionType) => void;
  dismissEmotionAction: () => void;
  resetEmotionTimer: () => void;
};

const EmotionContext = createContext<EmotionContextType | undefined>(undefined);

export const useEmotion = () => {
  const context = useContext(EmotionContext);
  if (context === undefined) {
    throw new Error('useEmotion must be used within an EmotionProvider');
  }
  return context;
};

export const EmotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>(null);
  const [showEmotionAction, setShowEmotionAction] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // Function to start a new emotion detection cycle
  const resetEmotionTimer = () => {
    if (timer) {
      clearTimeout(timer);
    }
    
    // In a real app, this would be 3 minutes (180000ms)
    // Using 30 seconds for demonstration purposes
    const newTimer = setTimeout(() => {
      // Mock emotion detection - in a real app, this would come from WebGazer.js
      // or another emotion detection API
      const emotions: EmotionType[] = ['boredom', 'confusion', 'fatigue', 'focus'];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      
      setCurrentEmotion(randomEmotion);
      setShowEmotionAction(true);
    }, 30000); // 30 seconds for demo purposes
    
    setTimer(newTimer);
  };

  // Dismiss the current emotion action
  const dismissEmotionAction = () => {
    setShowEmotionAction(false);
    resetEmotionTimer();
  };

  // Start the timer when the component mounts
  useEffect(() => {
    resetEmotionTimer();
    
    // Cleanup on unmount
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  return (
    <EmotionContext.Provider 
      value={{ 
        currentEmotion, 
        showEmotionAction, 
        setCurrentEmotion, 
        dismissEmotionAction, 
        resetEmotionTimer 
      }}
    >
      {children}
    </EmotionContext.Provider>
  );
};