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
  // Helper function to format duration precisely
  const formatDuration = (startTime: number, endTime: number | null) => {
    if (!endTime) return 'Ongoing'; // Or 'N/A'
    const durationMs = endTime - startTime;
    const totalSeconds = Math.round(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} min ${seconds} sec`;
  };
  
  // Emotion labels mapping for the probabilities array (order: boredom, confusion, fatigue, focus)
  const emotionLabels: { name: string; color: string; }[] = [
    { name: 'Boredom', color: 'bg-amber-500' },
    { name: 'Confusion', color: 'bg-purple-600' },
    { name: 'Fatigue', color: 'bg-orange-500' },
    { name: 'Focus', color: 'bg-green-600' },
  ];

  // Prepare emotion percentages from finalEmotionProbabilities
  const emotionPercentages: { name: string; percentage: number; color: string; }[] = [];

  if (session.finalEmotionProbabilities && session.finalEmotionProbabilities.length === emotionLabels.length) {
    session.finalEmotionProbabilities.forEach((prob, index) => {
      const label = emotionLabels[index];
      emotionPercentages.push({
        name: label.name,
        percentage: Math.round(prob * 100),
        color: label.color,
      });
    });
  } else {
    console.warn("finalEmotionProbabilities missing or malformed in session data. Displaying N/A.");
    emotionLabels.forEach(label => {
      emotionPercentages.push({
        name: label.name,
        percentage: 0,
        color: label.color,
      });
    });
  }
  
  // Count actions by type (remains the same)
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
              {session.startTime ? format(new Date(session.startTime), "MMMM d, BBBB 'at' h:mm a") : 'N/A'}
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
                {session.startTime ? formatDuration(session.startTime, session.endTime) : 'N/A'}
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
                {session.effectivenessScore !== undefined && session.effectivenessScore !== null ? `${session.effectivenessScore}/100` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 dark:text-white flex items-center mb-4">
            <BarChart2 className="h-5 w-5 mr-1.5 text-gray-600 dark:text-gray-400" /> 
            Overall Session Emotion
          </h4>
          
          <div className="space-y-4">
            {emotionPercentages.map(emotion => (
              <div key={emotion.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{emotion.name}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{emotion.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div className={`${emotion.color} h-2.5 rounded-full`} style={{ width: `${emotion.percentage}%` }}></div>
                </div>
              </div>
            ))}
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
