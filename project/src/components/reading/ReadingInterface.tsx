import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '../../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import EmotionResponseOverlay from '../emotion/EmotionResponseOverlay';
import SessionReportModal from '../reports/SessionReportModal';
import { Book, Clock, BarChart } from 'lucide-react';
import Button from '../ui/Button';

const ReadingInterface: React.FC = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // New pause state
  const [topicName, setTopicName] = useState('');
  const [showEndSessionPrompt, setShowEndSessionPrompt] = useState(false);
  const [showSessionReport, setShowSessionReport] = useState(false);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [readingTime, setReadingTime] = useState(0);

  // Topic info states
  const [topicInfo, setTopicInfo] = useState<string>('');
  const [loadingInfo, setLoadingInfo] = useState<boolean>(false);
  const [infoError, setInfoError] = useState<string>('');

  const { startSession, endSession } = useSession();
  const navigate = useNavigate();

  const gazeDataRef = useRef<{ x: number; y: number; t: number }[]>([]);

  // Reading time timer only runs if sessionStarted AND not paused
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (sessionStarted && !isPaused) {
      interval = setInterval(() => setReadingTime(prev => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionStarted, isPaused]);

  // Fetch topic info when topicName changes
  useEffect(() => {
    if (topicName.trim()) {
      fetchTopicInfo(topicName);
    } else {
      setTopicInfo('');
    }
  }, [topicName]);

  const fetchTopicInfo = async (topic: string) => {
    setLoadingInfo(true);
    setInfoError('');
    setTopicInfo('');
    try {
      const response = await fetch('http://localhost:5000/api/topic-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      setTopicInfo(data.content);
    } catch (err) {
      setInfoError('Failed to fetch topic info.');
    }
    setLoadingInfo(false);
  };

  // WebGazer control updated with isPaused
  useEffect(() => {
    if ((window as any).webgazer) {
      if (sessionStarted && !isPaused) {
        (window as any).webgazer
          .setGazeListener((data: { x: number; y: number } | null) => {
            if (data) {
              gazeDataRef.current.push({ x: data.x, y: data.y, t: Date.now() });
            }
          })
          .showVideo(true)
          .showFaceOverlay(true)
          .showFaceFeedbackBox(true)
          .begin();
        console.log("WebGazer started and preview is visible.");
      } else {
        (window as any).webgazer.pause();
        (window as any).webgazer.showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);
        console.log("WebGazer paused or session not started.");
      }
    }
    return () => {
      if ((window as any).webgazer) {
        (window as any).webgazer.pause();
        (window as any).webgazer.showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);
      }
    };
  }, [sessionStarted, isPaused]);

  // Format seconds as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start session
  const handleStartSession = () => {
    if (!topicName.trim()) {
      alert('Please enter a topic name');
      return;
    }
    startSession(topicName);
    setSessionStarted(true);
    setIsPaused(false);
  };

  // End session
  const handleEndSession = () => {
    setShowEndSessionPrompt(false);

    if ((window as any).webgazer) {
      (window as any).webgazer.pause();
      (window as any).webgazer.showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);
      console.log("WebGazer paused, camera and pop-up off.");
    }

    console.log("Collected gaze data:", gazeDataRef.current);

    const session = endSession();
    setCompletedSession(session);
    setShowSessionReport(true);
    setSessionStarted(false);
    setIsPaused(false);
    setReadingTime(0);
    gazeDataRef.current = [];
  };

  // Handle break: pause WebGazer for given seconds, then resume
  const handleTakeBreak = (seconds: number) => {
    if (!sessionStarted) return; // only if session active

    console.log(`Taking a break for ${seconds} seconds...`);
    setIsPaused(true);

    setTimeout(() => {
      setIsPaused(false);
      console.log('Break ended. Resuming session.');
    }, seconds * 1000);
  };

  const handleCloseReport = () => {
    setShowSessionReport(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 pb-8">
      {!sessionStarted ? (
        <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
          <div className="text-center">
            <Book className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
            <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Start a Reading Session
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              Enter a topic name and begin your focused reading session.
            </p>
          </div>
          <div className="mt-8 w-full max-w-md">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Topic Name
            </label>
            <input
              type="text"
              id="topic"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g., Learning Science Fundamentals"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-4"
              onClick={handleStartSession}
              disabled={!topicName.trim()}
            >
              Start Reading Session
            </Button>
          </div>
          <div className="w-full max-w-2xl mx-auto mt-8">
            {loadingInfo && <p>Loading topic info...</p>}
            {infoError && <p className="text-red-500">{infoError}</p>}
            {topicInfo && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-4 my-4">
                <h2 className="font-bold mb-2">About "{topicName}"</h2>
                <p>{topicInfo}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
              {topicName}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">{formatTime(readingTime)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<BarChart size={16} />}
                onClick={() => setShowEndSessionPrompt(true)}
              >
                End Session
              </Button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:p-8 mb-8">
            <div className="prose dark:prose-invert max-w-none">
              <p>Start reading your topic content here!</p>
            </div>
            <div className="w-full max-w-2xl mx-auto mt-8">
              {loadingInfo && <p>Loading topic info...</p>}
              {infoError && <p className="text-red-500">{infoError}</p>}
              {topicInfo && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-4 my-4">
                  <h2 className="font-bold mb-2">About "{topicName}"</h2>
                  <p>{topicInfo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pass handleTakeBreak to EmotionResponseOverlay */}
      <EmotionResponseOverlay onTakeBreak={handleTakeBreak} />

      {showEndSessionPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              End Reading Session?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to end this reading session? Your progress will be saved and you'll receive a summary report.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEndSessionPrompt(false)}
              >
                Continue Reading
              </Button>
              <Button
                variant="danger"
                onClick={handleEndSession}
              >
                End Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSessionReport && completedSession && (
        <SessionReportModal
          isOpen={showSessionReport}
          onClose={handleCloseReport}
          session={completedSession}
        />
      )}
    </div>
  );
};

export default ReadingInterface;
