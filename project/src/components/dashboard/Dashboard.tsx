import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Book, BarChart, ClipboardList } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '../ui/Card';
import SessionReportModal from '../reports/SessionReportModal';
import { SessionData } from '../../context/SessionContext'; 

const Dashboard: React.FC = () => {
  const { pastSessions, startSession } = useSession();
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [showSessionReport, setShowSessionReport] = useState(false);
  const navigate = useNavigate();
  
  // Emotion labels and colors - MUST match the order of your ML model's output probabilities
  const emotionLabels = [
    { name: 'Boredom', color: 'bg-amber-500' },
    { name: 'Confusion', color: 'bg-purple-600' },
    { name: 'Fatigue', color: 'bg-orange-500' },
    { name: 'Focus', color: 'bg-green-600' },
  ];

  const handleStartNewSession = () => {
    navigate('/reading');
  };
  
  const handleViewSessionDetails = (session: SessionData) => {
    setSelectedSession(session);
    setShowSessionReport(true);
  };
  
  // Helper to determine color based on effectiveness score
  const getEffectivenessColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-500';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Helper function to format duration precisely
  const formatDuration = (startTime: number, endTime: number | null) => {
    if (!endTime) return 'Ongoing'; // Or 'N/A'
    const durationMs = endTime - startTime;
    const totalSeconds = Math.round(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} min ${seconds} sec`;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Learning Dashboard</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                Track your progress and view your past reading sessions
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button 
                variant="primary" 
                onClick={handleStartNewSession}
                icon={<Book size={18} />}
              >
                Start New Session
              </Button>
            </div>
          </div>
          
          {pastSessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No reading sessions yet</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Start your first reading session to begin tracking your learning progress.
              </p>
              <div className="mt-6">
                <Button 
                  variant="primary" 
                  onClick={handleStartNewSession}
                >
                  Start Your First Session
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Map through past sessions fetched from DB via SessionContext */}
              {pastSessions.map((session) => (
                <Card key={session.id} className="transition-all hover:shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <h3 className="font-medium text-lg text-gray-900 dark:text-white truncate">
                      {session.topic}
                    </h3>
                    {/* Display effectiveness score, handling undefined/null */}
                    <div className={`text-lg font-bold ${getEffectivenessColor(session.effectivenessScore)}`}>
                      {session.effectivenessScore !== undefined && session.effectivenessScore !== null ? `${session.effectivenessScore}/100` : 'N/A'}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Date</span>
                      <span>
                        {/* Format date, handling null startTime */}
                        {session.startTime ? format(new Date(session.startTime), 'MMM d, BBBB') : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Duration</span>
                      <span>
                        {/* Use the new formatDuration helper */}
                        {session.startTime ? formatDuration(session.startTime, session.endTime) : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Focus Level</span>
                      <span className="font-medium">
                        {/* Display qualitative focus level based on score */}
                        {(() => {
                          const score = session.effectivenessScore;
                          if (score === null || score === undefined) return 'N/A';
                          if (score >= 80) return 'Excellent';
                          if (score >= 60) return 'Good';
                          if (score >= 40) return 'Moderate';
                          return 'Needs Improvement';
                        })()}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <BarChart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Overall Emotion Distribution
                        </span>
                      </div>
                      
                      {/* Dynamic Emotion Distribution Bar based on finalEmotionProbabilities */}
                      <div className="h-2 w-full flex rounded-full overflow-hidden">
                        {session.finalEmotionProbabilities && session.finalEmotionProbabilities.length === emotionLabels.length ? (
                          session.finalEmotionProbabilities.map((prob, index) => {
                            const emotion = emotionLabels[index];
                            const width = Math.round(prob * 100); // Convert probability to percentage
                            return (
                              <div 
                                key={emotion.name} // Unique key for each segment
                                className={`${emotion.color} h-full`} // Apply dynamic color
                                style={{ width: `${width}%` }} // Set width based on percentage
                                title={`${emotion.name}: ${width}%`} // Tooltip for detailed info on hover
                              ></div>
                            );
                          })
                        ) : (
                          // Fallback bar if no emotion data is available
                          <div className="bg-gray-200 dark:bg-gray-700 h-full w-full" title="No emotion data"></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => handleViewSessionDetails(session)}
                    >
                      View Detailed Report
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {selectedSession && (
        <SessionReportModal
          isOpen={showSessionReport}
          onClose={() => setShowSessionReport(false)}
          session={selectedSession}
        />
      )}
    </div>
  );
};

export default Dashboard;
