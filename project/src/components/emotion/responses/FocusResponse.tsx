import React from 'react'; // Removed useEffect as it's no longer needed for action recording
import { Zap } from 'lucide-react';

interface FocusResponseProps {
  onAction: (actionType: string) => void; // Keeping onAction prop in case it's used for other interactions later
}

const FocusResponse: React.FC<FocusResponseProps> = ({ onAction }) => {
  // Removed useEffect: 'acknowledged_focus_state' is now recorded in EmotionResponseOverlay
  // when the 'focus' emotion is initially displayed.

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
          <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Great focus!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You're in the zone. Keep up the good work!
          </p>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        {/* Animated bar for visual effect */}
        <div className="bg-green-600 h-2.5 rounded-full w-0 animate-[grow_3s_ease-out_forwards]" />
      </div>
    </div>
  );
};

export default FocusResponse;
