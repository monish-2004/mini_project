import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import Button from '../../ui/Button';

interface BoredomResponseProps {
  topic?: string;
  // UPDATED: onAction can now also receive a topic string
  onAction?: (actionType: string, topic?: string) => void;
  dismissOverlay: () => void;
}

const BoredomResponse: React.FC<BoredomResponseProps> = ({ topic, onAction, dismissOverlay }) => {

  const handleTakeQuiz = () => {
    // UPDATED: Pass the topic prop to onAction
    onAction?.('start_quiz', topic); 
    dismissOverlay(); 
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
          <Brain className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Looking for a challenge?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            We noticed you might be getting bored. How about a quick activity?
          </p>
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleTakeQuiz}
          icon={<Sparkles size={16} />}
        >
          Take a Mini Quiz
        </Button>
      </div>
    </div>
  );
};

export default BoredomResponse;
