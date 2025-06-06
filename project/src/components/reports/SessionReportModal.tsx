import React from 'react';
import { format } from 'date-fns';
import { BarChart2, Clock, Award } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { SessionData } from '../../context/SessionContext';

interface SessionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData;
}

const SessionReportModal: React.FC<SessionReportModalProps> = ({
  isOpen,
  onClose,
  session
}) => {
  // Calculate session duration in minutes
  const durationMs = (session.endTime || Date.now()) - session.startTime;
  const durationMinutes = Math.round(durationMs / 60000);
  
  // Calculate emotion percentages
  const calculateEmotionPercentage = (emotion: string) => {
    let totalTime = 0;
    let emotionTime = 0;
    
    session.emotions.forEach(record => {
      const duration = record.duration || 0;
      totalTime += duration;
      
      if (record.emotion === emotion) {
        emotionTime += duration;
      }
    });
    
    return totalTime ? Math.round((emotionTime / totalTime) * 100) : 0;
  };
  
  const focusPercentage = calculateEmotionPercentage('focus');
  const boredomPercentage = calculateEmotionPercentage('boredom');
  const confusionPercentage = calculateEmotionPercentage('confusion');
  const fatiguePercentage = calculateEmotionPercentage('fatigue');
  
  // Count actions by type
  const actionCounts: Record<string, number> = {};
  session.actions.forEach(action => {
    actionCounts[action.type] = (actionCounts[action.type] || 0) + 1;
  });
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Report"
      maxWidth="lg"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-start space-x-4">
          <div className="mt-0.5">
            <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">{session.topic}</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {format(new Date(session.startTime), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-800 dark:text-white flex items-center">
                <Clock className="h-5 w-5 mr-1.5 text-gray-600 dark:text-gray-400" /> 
                Session Time
              </h4>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                {durationMinutes} min
              </span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-800 dark:text-white flex items-center">
                <Award className="h-5 w-5 mr-1.5 text-gray-600 dark:text-gray-400" /> 
                Effectiveness Score
              </h4>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                {session.effectivenessScore || 0}/100
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 dark:text-white flex items-center mb-4">
            <BarChart2 className="h-5 w-5 mr-1.5 text-gray-600 dark:text-gray-400" /> 
            Emotion Breakdown
          </h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Focus</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{focusPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${focusPercentage}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Boredom</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{boredomPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${boredomPercentage}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Confusion</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{confusionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${confusionPercentage}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Fatigue</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fatiguePercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${fatiguePercentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 dark:text-white mb-4">Actions Taken</h4>
          
          {Object.keys(actionCounts).length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {Object.entries(actionCounts).map(([type, count]) => (
                <li key={type} className="flex justify-between">
                  <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{count}x</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No actions were taken during this session.</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>
            Close Report
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionReportModal;