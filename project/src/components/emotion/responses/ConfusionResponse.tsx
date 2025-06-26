import React from 'react';
import { HelpCircle } from 'lucide-react';
import Button from '../../ui/Button';

interface ConfusionResponseProps {
  // onAction will now be used to signal "get_assistance"
  onAction: (actionType: string) => void;
  // This prop is passed directly from EmotionResponseOverlay's dismissEmotionAction
  dismissOverlay: () => void; 
}

const ConfusionResponse: React.FC<ConfusionResponseProps> = ({ onAction, dismissOverlay }) => {

  const handleGetAssistance = () => {
    onAction('get_assistance'); // Signal that user wants assistance
    dismissOverlay(); // Dismiss the current confusion overlay
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
          <HelpCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Need some help?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You seem confused. Let me assist you with this material.
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={handleGetAssistance} // Call the new handler
        fullWidth
        className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 focus:ring-purple-500"
      >
        Get Assistance
      </Button>
    </div>
  );
};

export default ConfusionResponse;
