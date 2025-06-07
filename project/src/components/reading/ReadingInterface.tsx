// src/components/reading/ReadingInterface.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '../../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import EmotionResponseOverlay from '../emotion/EmotionResponseOverlay';
import SessionReportModal from '../reports/SessionReportModal';
import { Book, Clock, BarChart } from 'lucide-react';
import Button from '../ui/Button';

// Helper functions for average & standard deviation
const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
const stdev = (arr: number[]) => {
  const m = average(arr);
  const sqDiffs = arr.map((x) => (x - m) ** 2);
  return Math.sqrt(average(sqDiffs));
};

type EmotionProbs = number[];

// Define a basic type for the session object, adjust as per your SessionContext
interface Session {
  id: string;
  topic: string;
  startTime: number;
  endTime: number | null;
  // Add other session properties here
}

// Declare webgazer globally for TypeScript
declare global {
  interface Window {
    webgazer: any; // Ideally, you'd define a more specific interface for webgazer
  }
}

const ReadingInterface: React.FC = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // New pause state
  const [topicName, setTopicName] = useState('');
  const [showEndSessionPrompt, setShowEndSessionPrompt] = useState(false);
  const [showSessionReport, setShowSessionReport] = useState(false);
  const [completedSession, setCompletedSession] = useState<Session | null>(null); // Use specific Session type
  const [readingTime, setReadingTime] = useState(0);

  // Topic info states
  const [topicInfo, setTopicInfo] = useState<string>('');
  const [loadingInfo, setLoadingInfo] = useState<boolean>(false);
  const [infoError, setInfoError] = useState<string>('');

  const { startSession, endSession } = useSession();
  const navigate = useNavigate();

  // ───────────── GAZE DATA / FEATURE BUFFERS ─────────────
  // We store raw gaze points in a ref to avoid re-renders
  const gazeDataRef = useRef<{ x: number; y: number; t: number }[]>([]);

  // Buffers for events in the current 10s window:
  const fixationDurationsRef = useRef<number[]>([]);
  const saccadeDurationsRef = useRef<number[]>([]);
  const saccadeAmplitudesRef = useRef<number[]>([]);
  const blinkDurationsRef = useRef<number[]>([]);
  const microsaccadeCountRef = useRef<number>(0);

  // Track “in-progress” fixation or blink start times:
  const fixationStartRef = useRef<number | null>(null);
  const blinkStartRef = useRef<number | null>(null);

  // Buffer for the last 12 returned probability arrays (2 min = 12×10s)
  const emotionProbsHistoryRef = useRef<EmotionProbs[]>([]);

  // ID for the 10-second interval
  const featureIntervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // ───────────── WEBGAZER CONTROL FUNCTIONS ─────────────

  const startWebGazer = useCallback(() => {
    if (!window.webgazer) { // Directly access window.webgazer due to global declaration
      console.warn('❌ WebGazer not found on window.');
      return;
    }

    window.webgazer
      .setGazeListener((data: { x: number; y: number; confidence?: number } | null, _timestamp: number) => { // Removed unused 'timestamp'
        if (!data) return;

        // 1) Store raw gaze
        gazeDataRef.current.push({ x: data.x, y: data.y, t: Date.now() });

        // 2) Saccade / Microsaccade detection
        const last = gazeDataRef.current[gazeDataRef.current.length - 2];
        if (last) {
          const dx = data.x - last.x;
          const dy = data.y - last.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const dt = Date.now() - last.t;
          if (dist > 15) {
            saccadeDurationsRef.current.push(dt);
            saccadeAmplitudesRef.current.push(dist);
            if (dist < 30) {
              microsaccadeCountRef.current += 1;
            }
          }
        }

        // 3) Fixation detection (stable <50px for >200ms)
        if (last) {
          const dx2 = data.x - last.x;
          const dy2 = data.y - last.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 50) {
            if (fixationStartRef.current === null) {
              fixationStartRef.current = last.t; // mark start
            } else if (Date.now() - fixationStartRef.current > 200) {
              fixationDurationsRef.current.push(Date.now() - fixationStartRef.current);
              fixationStartRef.current = null; // only one per cluster
            }
          } else {
            fixationStartRef.current = null;
          }
        }

        // 4) Blink detection via confidence < 0.2
        if (data.confidence !== undefined) {
          if (data.confidence < 0.2 && blinkStartRef.current === null) {
            blinkStartRef.current = Date.now();
          } else if (blinkStartRef.current !== null && data.confidence >= 0.2) {
            blinkDurationsRef.current.push(Date.now() - blinkStartRef.current);
            blinkStartRef.current = null;
          }
        }
      })
      .showVideo(true)
      .showFaceOverlay(true)
      .showFaceFeedbackBox(true)
      .begin();

    console.log('✅ WebGazer started.');
  }, []);

  const pauseWebGazer = useCallback(() => {
    if (!window.webgazer) return;
    window.webgazer.pause();
    window.webgazer.showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);
    console.log('⏸️ WebGazer paused.');
  }, []);

  const resumeWebGazer = useCallback(() => {
    if (!window.webgazer) return;
    window.webgazer.resume();
    window.webgazer.showVideo(true).showFaceOverlay(true).showFaceFeedbackBox(true);
    console.log('▶️ WebGazer resumed.');
  }, []);

  const stopWebGazer = useCallback(() => {
    if (!window.webgazer) return;
    window.webgazer.pause();
    window.webgazer.showVideo(false).showFaceOverlay(false).showFaceFeedbackBox(false);
    window.webgazer.clearGazeListener();
    console.log('🛑 WebGazer fully stopped.');
  }, []);

  // Reading time timer only runs if sessionStarted AND not paused
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (sessionStarted && !isPaused) {
      interval = setInterval(() => setReadingTime((prev) => prev + 1), 1000);
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
    } catch (err: any) { // Type 'any' can be narrowed if 'err' is always an 'Error' instance
      setInfoError('Failed to fetch topic info: ' + err.message);
      console.error('Failed to fetch topic info:', err); // Log the error for debugging
    }
    setLoadingInfo(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ───────────── START / END SESSION ─────────────
  const handleStartSession = () => {
    if (!topicName.trim()) {
      alert('Please enter a topic name');
      return;
    }
    startSession(topicName);
    setSessionStarted(true);
    setIsPaused(false); // Ensure not paused on start
    setReadingTime(0);

    // 1) Start WebGazer
    startWebGazer();

    // 2) Begin 10-second feature-send interval
    featureIntervalIdRef.current = setInterval(() => {
      computeAndSendFeatures();
    }, 10_000);
  };

  const handleEndSession = () => {
    console.log('handleEndSession called');
    setShowEndSessionPrompt(false);

    // 1) Fully stop WebGazer
    stopWebGazer();

    // 2) Clear 10-second interval
    if (featureIntervalIdRef.current) {
      clearInterval(featureIntervalIdRef.current);
      featureIntervalIdRef.current = null;
    }

    // 3) End session in context & show report
    console.log('Collected raw gaze data:', gazeDataRef.current);
    const session = endSession(); // Assuming endSession returns a Session object
    setCompletedSession(session);
    setShowSessionReport(true);

    // 4) Reset all buffers
    gazeDataRef.current = [];
    fixationDurationsRef.current = [];
    saccadeDurationsRef.current = [];
    saccadeAmplitudesRef.current = [];
    blinkDurationsRef.current = [];
    microsaccadeCountRef.current = 0;
    fixationStartRef.current = null;
    blinkStartRef.current = null;
    emotionProbsHistoryRef.current = [];
    setSessionStarted(false);
    setIsPaused(false);
    setReadingTime(0);
  };

  const handleCloseReport = () => {
    setShowSessionReport(false);
    navigate('/dashboard');
  };

  // Handle break: pause WebGazer for given seconds, then resume
  const handleTakeBreak = (seconds: number) => {
    if (!sessionStarted) return; // only if session active

    console.log(`Taking a break for ${seconds} seconds...`);
    setIsPaused(true);
    pauseWebGazer(); // Explicitly pause WebGazer

    setTimeout(() => {
      setIsPaused(false);
      resumeWebGazer(); // Explicitly resume WebGazer
      console.log('Break ended. Resuming session.');
    }, seconds * 1000);
  };

  // ───────────── COMPUTE + SEND FEATURES EVERY 10s ─────────────
  const computeAndSendFeatures = async () => {
    // Only compute and send features if the session is not paused
    if (isPaused) {
      console.log('Session paused, skipping feature computation and send.');
      return;
    }

    // 1) We want the events that occurred *since the last call*,
    //    but because we reset the arrays right after each send, we can just snapshot & reset now.
    const fixDurs = [...fixationDurationsRef.current];
    const sacDurs = [...saccadeDurationsRef.current];
    const sacAmps = [...saccadeAmplitudesRef.current];
    const blinkDurs = [...blinkDurationsRef.current];
    const microCnt = microsaccadeCountRef.current;

    // Reset for next window
    fixationDurationsRef.current = [];
    saccadeDurationsRef.current = [];
    saccadeAmplitudesRef.current = [];
    blinkDurationsRef.current = [];
    microsaccadeCountRef.current = 0;

    // 2) Compute the nine features:
    const numFix = fixDurs.length;
    const meanFix = numFix ? average(fixDurs) : 0;
    const sdFix = numFix ? stdev(fixDurs) : 0;

    const numSac = sacDurs.length;
    const meanSac = numSac ? average(sacDurs) : 0;
    const meanAmp = sacAmps.length ? average(sacAmps) : 0;

    const numBlink = blinkDurs.length;
    const meanBlink = numBlink ? average(blinkDurs) : 0;

    const featureVector = [
      numFix,
      parseFloat(meanFix.toFixed(2)),
      parseFloat(sdFix.toFixed(2)),
      numSac,
      parseFloat(meanSac.toFixed(2)),
      parseFloat(meanAmp.toFixed(2)),
      numBlink,
      parseFloat(meanBlink.toFixed(2)),
      microCnt,
    ];

    // 3) POST to /api/emotion (Node server running on port 5000)
    try {
      const response = await fetch('http://localhost:5000/api/emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: featureVector }),
      });
      if (!response.ok) {
        console.error('❌ Server error:', await response.text());
        return;
      }
      const json = await response.json();
      const probs: EmotionProbs = json.emotionProbs;
      console.log('📶 Received emotion probabilities:', probs);

      // Save into history
      emotionProbsHistoryRef.current.push(probs);

      // If we have 12 arrays (2 minutes worth), decide & trigger action
      if (emotionProbsHistoryRef.current.length === 12) {
        decideAndTriggerAdaptiveAction();
      }
    } catch (err) {
      console.error('❌ Failed to POST features:', err);
    }
  };

  // ───────────── DECIDE + TRIGGER ADAPTIVE ACTION ─────────────
  const decideAndTriggerAdaptiveAction = () => {
    const allProbs = emotionProbsHistoryRef.current; // array of 12 vectors
    const numClasses = allProbs[0].length;
    const sumProbs = new Array<number>(numClasses).fill(0);

    allProbs.forEach((vec) => {
      for (let i = 0; i < numClasses; i++) {
        sumProbs[i] += vec[i];
      }
    });

    const avgProbs = sumProbs.map((s) => s / allProbs.length);
    // Convert to percentages if desired: avgProbs[i] * 100

    // Determine highest‐probability index
    let bestIdx = 0;
    for (let i = 1; i < avgProbs.length; i++) {
      if (avgProbs[i] > avgProbs[bestIdx]) bestIdx = i;
    }

    // Map index → label (must match your encoder.json order)
    // Example order: ['boredom','confusion','fatigue','focus']
    const emotionLabels = ['boredom', 'confusion', 'fatigue', 'focus'];
    const chosenEmotion = emotionLabels[bestIdx];
    console.log('🔍 Dominant emotion (2 min window):', chosenEmotion);

    // Dispatch a custom event so we can open the overlay
    window.dispatchEvent(new CustomEvent('triggerEmotion', { detail: chosenEmotion }));

    // Immediately pause WebGazer
    pauseWebGazer();
    setIsPaused(true); // Set local state to paused
  };

  // ───────────── LISTEN for overlay‐close event ─────────────
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayEmotion, setOverlayEmotion] = useState<string>('');

  useEffect(() => {
    const onTrigger = (e: Event) => {
      const custom = e as CustomEvent;
      const chosenEmotion = custom.detail as string;
      setOverlayEmotion(chosenEmotion);
      setShowOverlay(true);
    };
    window.addEventListener('triggerEmotion', onTrigger as EventListener); // Cast to EventListener
    return () => {
      window.removeEventListener('triggerEmotion', onTrigger as EventListener); // Cast to EventListener
    };
  }, []);

  const handleOverlayClose = () => {
    setShowOverlay(false);

    // Clear the old 12‐element buffer and start fresh
    emotionProbsHistoryRef.current = [];

    // Resume WebGazer and continue the 10s interval
    resumeWebGazer();
    setIsPaused(false); // Set local state to resumed
  };

  // ───────────── RENDER ─────────────
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
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
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
          {/* Reading header */}
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

          {/* Reading content area */}
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

      {/* Emotion overlay */}
      {showOverlay && (
        <EmotionResponseOverlay
          emotion={overlayEmotion}
          onClose={handleOverlayClose}
          onTakeBreak={handleTakeBreak}
        />
      )}

      {/* End session confirmation */}
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
              <Button variant="outline" onClick={() => setShowEndSessionPrompt(false)}>
                Continue Reading
              </Button>
              <Button variant="danger" onClick={handleEndSession}>
                End Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session report */}
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