// src/components/emotion/responses/FatigueResponse.tsx

import React from 'react';
import { Coffee, Clock } from 'lucide-react';
import Button from '../../ui/Button';

interface FatigueResponseProps {
  onAction: (actionType: string) => void;
}

const FatigueResponse: React.FC<FatigueResponseProps> = ({ onAction }) => {
  const handleBreak = () => {
    onAction('take_break'); // Triggers 5-minute break in EmotionResponseOverlay
  };

  const handleContinue = () => {
    onAction('continue_despite_fatigue'); // Just logs continue action
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
          <Coffee className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Time for a break?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You seem a bit tired. Taking a short break can help improve focus.
          </p>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleBreak}
          icon={<Clock size={16} />}
          className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 focus:ring-orange-500"
        >
          Take a 5 Minute Break
        </Button>

        <Button variant="outline" size="md" onClick={handleContinue}>
          Continue Studying
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
        Studies show that short breaks can increase productivity by up to 20%.
      </p>
    </div>
  );
};

export default FatigueResponse;
