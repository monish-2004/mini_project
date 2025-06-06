import React, { useEffect } from 'react';
import { Zap } from 'lucide-react';

interface FocusResponseProps {
  onAction: (actionType: string) => void;
}

const FocusResponse: React.FC<FocusResponseProps> = ({ onAction }) => {
  useEffect(() => {
    onAction('acknowledged_focus_state');
    // No timer here — dismissal handled in parent on this action
  }, [onAction]);

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
        <div className="bg-green-600 h-2.5 rounded-full w-0 animate-[grow_3s_ease-out_forwards]" />
      </div>
    </div>
  );
};

export default FocusResponse;
