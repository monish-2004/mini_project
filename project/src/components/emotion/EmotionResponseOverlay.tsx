import React from 'react';
import { useEmotion } from '../../context/EmotionContext';
import { useSession } from '../../context/SessionContext';
import { X } from 'lucide-react';
import BoredomResponse from './responses/BoredomResponse';
import ConfusionResponse from './responses/ConfusionResponse';
import FatigueResponse from './responses/FatigueResponse';
import FocusResponse from './responses/FocusResponse';

interface EmotionResponseOverlayProps {
  onTakeBreak: (durationInSeconds: number) => void;
}

const EmotionResponseOverlay: React.FC<EmotionResponseOverlayProps> = ({ onTakeBreak }) => {
  const { currentEmotion, showEmotionAction, dismissEmotionAction } = useEmotion();
  const { recordAction } = useSession();

  if (!showEmotionAction || !currentEmotion) {
    return null;
  }

  const handleAction = (actionType: string) => {
    recordAction(actionType, currentEmotion);

    if (currentEmotion === 'fatigue' && actionType === 'take_break') {
      onTakeBreak(300); // 5 minutes
      dismissEmotionAction();
      return;
    }

    if (currentEmotion === 'focus' && actionType === 'acknowledged_focus_state') {
      setTimeout(() => {
        dismissEmotionAction();
      }, 3000);
      return;
    }

    dismissEmotionAction();
  };

  const renderEmotionResponse = () => {
    switch (currentEmotion) {
      case 'boredom':
        return <BoredomResponse onAction={handleAction} />;
      case 'confusion':
        return <ConfusionResponse onAction={handleAction} />;
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
