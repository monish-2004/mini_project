import React, { createContext, useState, useContext, useEffect } from 'react'; // Removed useRef, as timerRef is no longer needed for auto-mocking

// Define emotion types
export type EmotionType = 'boredom' | 'confusion' | 'fatigue' | 'focus' | null;

type EmotionContextType = {
  currentEmotion: EmotionType;
  showEmotionAction: boolean;
  setCurrentEmotion: (emotion: EmotionType | null) => void; // Allow setting to null to dismiss
  dismissEmotionAction: () => void;
  // resetEmotionTimer is removed as it's no longer responsible for auto-triggering
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
  const [currentEmotion, _setCurrentEmotion] = useState<EmotionType>(null); // Renamed to _setCurrentEmotion for internal use
  const [showEmotionAction, setShowEmotionAction] = useState(false);

  // This function will now be the public interface for setting emotion and showing the action
  const setCurrentEmotion = (emotion: EmotionType | null) => {
    _setCurrentEmotion(emotion);
    // If an emotion is provided (not null), show the action. Otherwise, hide it.
    setShowEmotionAction(emotion !== null);
  };

  // Dismiss the current emotion action (called from overlay when user is done)
  const dismissEmotionAction = () => {
    _setCurrentEmotion(null); // Clear the emotion
    setShowEmotionAction(false); // Hide the overlay
    // No need to reset a timer here, as detection is now externally driven
  };

  // useEffect for initial setup or cleanup if needed, no longer for auto-triggering mock
  useEffect(() => {
    // Any initial setup for emotion tracking, if necessary (e.g., subscribing to an external service)
    // No mock timer needed here anymore.
    return () => {
      // Cleanup code if any subscriptions were made
    };
  }, []); // Empty dependency array means it runs once on mount and once on unmount

  return (
    <EmotionContext.Provider 
      value={{ 
        currentEmotion, 
        showEmotionAction, 
        setCurrentEmotion, // Expose the new setCurrentEmotion
        dismissEmotionAction, 
      }}
    >
      {children}
    </EmotionContext.Provider>
  );
};
