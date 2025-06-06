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
  
  const handleStartNewSession = () => {
    navigate('/reading');
  };
  
  const handleViewSessionDetails = (session: SessionData) => {
    setSelectedSession(session);
    setShowSessionReport(true);
  };
  
  const getEffectivenessColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
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
              {pastSessions.map((session) => (
                <Card key={session.id} className="transition-all hover:shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <h3 className="font-medium text-lg text-gray-900 dark:text-white truncate">
                      {session.topic}
                    </h3>
                    <div className={`text-lg font-bold ${getEffectivenessColor(session.effectivenessScore)}`}>
                      {session.effectivenessScore}/100
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Date</span>
                      <span>{format(new Date(session.startTime), 'MMM d, yyyy')}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Duration</span>
                      <span>
                        {Math.round(((session.endTime || Date.now()) - session.startTime) / 60000)} min
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Focus Level</span>
                      <span className="font-medium">
                        {(() => {
                          const score = session.effectivenessScore;
                          if (score === null) return 'N/A';
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
                          Emotion Distribution
                        </span>
                      </div>
                      
                      <div className="h-2 w-full flex rounded-full overflow-hidden">
                        {/* This is a simplified visualization - in a real app this would be calculated from session.emotions */}
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${Math.min(70, session.effectivenessScore || 0)}%` }}
                        ></div>
                        <div 
                          className="bg-purple-500" 
                          style={{ width: `${Math.min(20, 100 - (session.effectivenessScore || 0))/2}%` }}
                        ></div>
                        <div 
                          className="bg-amber-500" 
                          style={{ width: `${Math.min(15, 100 - (session.effectivenessScore || 0))/3}%` }}
                        ></div>
                        <div 
                          className="bg-orange-500" 
                          style={{ width: `${Math.min(15, 100 - (session.effectivenessScore || 0))/3}%` }}
                        ></div>
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