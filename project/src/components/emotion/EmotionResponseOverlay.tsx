// src/components/emotion/EmotionResponseOverlay.tsx
import React, { useEffect } from 'react';
import { useEmotion } from '../../context/EmotionContext';
import { useSession } from '../../context/SessionContext';
import { X } from 'lucide-react';
import BoredomResponse from './responses/BoredomResponse';
import ConfusionResponse from './responses/ConfusionResponse';
import FatigueResponse from './responses/FatigueResponse';
import FocusResponse from './responses/FocusResponse';

interface EmotionResponseOverlayProps {
  onTakeBreak: (durationInSeconds: number) => void;
  onConfusionChatRequest: () => void;
  onBoredomQuizRequest: (topic: string) => void; 
  topic: string; // NEW: Accept topic prop from ReadingInterface
}

const EmotionResponseOverlay: React.FC<EmotionResponseOverlayProps> = ({ 
  onTakeBreak, 
  onConfusionChatRequest,
  onBoredomQuizRequest,
  topic // Destructure the new topic prop
}) => {
  const { currentEmotion, showEmotionAction, dismissEmotionAction, setCurrentEmotion } = useEmotion();
  const { recordAction } = useSession();

  useEffect(() => {
    if (showEmotionAction && currentEmotion === 'focus') {
      recordAction('acknowledged_focus_state', 'focus'); 
      const timer = setTimeout(() => {
        dismissEmotionAction();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showEmotionAction, currentEmotion, recordAction, dismissEmotionAction]);


  if (!showEmotionAction || !currentEmotion) {
    return null;
  }

  // handleAction can now directly use the 'topic' passed from the child component
  const handleAction = (actionType: string, actionTopic?: string) => { // Renamed param to actionTopic to avoid confusion
    if (actionType !== 'acknowledged_focus_state') {
        recordAction(actionType, currentEmotion);
    }

    if (currentEmotion === 'fatigue') {
      if (actionType === 'take_break') {
        onTakeBreak(300);
        dismissEmotionAction(); 
        return;
      }
      if (actionType === 'continue_despite_fatigue') {
        dismissEmotionAction();
        return;
      }
    }
    
    if (currentEmotion === 'confusion' && actionType === 'get_assistance') {
        onConfusionChatRequest(); 
        return; 
    }

    if (currentEmotion === 'boredom' && actionType === 'start_quiz') {
        // Pass the topic received from BoredomResponse (actionTopic) or the general topic prop
        onBoredomQuizRequest(actionTopic || topic || "general knowledge"); 
        return;
    }

    dismissEmotionAction(); 
  };

  const renderEmotionResponse = () => {
    switch (currentEmotion) {
      case 'boredom':
        // Pass the topic down to BoredomResponse
        return <BoredomResponse onAction={handleAction} dismissOverlay={dismissEmotionAction} topic={topic} />;
      case 'confusion':
        return <ConfusionResponse onAction={handleAction} dismissOverlay={dismissEmotionAction} />; 
      case 'fatigue':
        return <FatigueResponse onAction={handleAction} />; 
      case 'focus':
        return <FocusResponse onAction={handleAction} />; 
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div
        className="
          pointer-events-auto max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg
          transform transition-all duration-300 ease-in-out
          animate-in fade-in-50 zoom-in-95
        "
        style={{
          position: 'absolute',
          right: '1.5rem',
          bottom: '1.5rem',
        }}
      >
        <div className="p-4 relative">
          <button
            onClick={dismissEmotionAction} 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
          {renderEmotionResponse()}
        </div>
      </div>
    </div>
  );
};

export default EmotionResponseOverlay;
