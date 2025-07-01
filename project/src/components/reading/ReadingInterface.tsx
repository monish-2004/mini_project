// src/components/reading/ReadingInterface.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '../../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import EmotionResponseOverlay from '../emotion/EmotionResponseOverlay';
import SessionReportModal from '../reports/SessionReportModal';
import { Book, Clock, BarChart } from 'lucide-react';
import Button from '../ui/Button';
import { useEmotion, EmotionType } from '../../context/EmotionContext';
import Modal from '../ui/Modal'; 
import { HelpCircle, Send, X, Brain, Sparkles } from 'lucide-react'; 
import { fetchQuiz, QuizData } from '../../api/quizApi';

// Helper functions for average & standard deviation
const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
const stdev = (arr: number[]) => {
  const m = average(arr);
  const sqDiffs = arr.map((x) => (x - m) ** 2);
  return Math.sqrt(average(sqDiffs));
};

type EmotionProbs = number[]; 

interface Session {
  id: string;
  topic: string;
  endTime: number | null;
  finalEmotionProbabilities?: number[];
  startTime: number;
}

declare global {
  interface Window {
    webgazer: any; // Declare webgazer globally
  }
}

// ConfusionChatModal Component 
interface ConfusionChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendQuestion: (question: string) => Promise<string>; 
  topic: string;
}

const ConfusionChatModal: React.FC<ConfusionChatModalProps> = ({ isOpen, onClose, onSendQuestion, topic }) => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [loading, setLoading] = useState(false);

  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!question.trim()) return;

    const userMessage = question.trim();

    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setQuestion('');

    try {
      const assistantReply = await onSendQuestion(userMessage); 
      setChatHistory(prev => [...prev, { role: 'assistant', content: assistantReply }]);
    } catch (error) {
      console.error("Error sending message to AI assistant:", error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error contacting the assistant. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Assistant" maxWidth="md">
      <div className="flex flex-col h-96">
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
              <p>How can I help you understand the material better?</p>
              <p className="text-xs mt-1">(About: {topic || 'No topic'})</p>
            </div>
          ) : (
            chatHistory.map((message, index) => (
              <div
                key={index}
                className={`
                  p-3 rounded-lg max-w-[80%]
                  ${message.role === 'user'
                    ? 'bg-blue-100 dark:bg-blue-900/30 ml-auto text-gray-800 dark:text-white'
                    : 'bg-gray-100 dark:bg-gray-700 mr-auto text-gray-800 dark:text-white'}
                `}
              >
                {message.content}
              </div>
            ))
          )}
          {loading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">Assistant is typing...</div>
          )}
          <div ref={chatMessagesEndRef} />
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            className="px-3 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

// QuizModal Component (remains the same)
interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, topic }) => {
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [selected, setSelected] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const { recordAction } = useSession();

  useEffect(() => {
    if (isOpen) {
      handleFetchQuiz();
    } else {
      setQuizzes([]);
      setSelected({});
      setResults({});
    }
  }, [isOpen, topic]);

  const handleFetchQuiz = async () => {
    recordAction('start_quiz', 'boredom');
    setLoading(true);
    setResults({});
    setSelected({});
    setQuizzes([]);
    try {
      const fetchedQuizzes = await fetchQuiz(topic || 'general knowledge');
      setQuizzes(fetchedQuizzes);
    } catch (error) {
      console.error("QuizModal: Error fetching quizzes:", error);
      setQuizzes([{
        question: "Failed to load quiz. Please try again later. (Check console for error)",
        options: [],
        answer: ""
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (quizIdx: number, option: string) => {
    setSelected(prev => ({ ...prev, [quizIdx]: option }));
    setResults(prev => ({
      ...prev,
      [quizIdx]: quizzes[quizIdx] && option === quizzes[quizIdx].answer
        ? "Correct! 🎉"
        : `Oops! The correct answer is ${quizzes[idx]?.answer}.`
    }));
    recordAction(`answered_question_${quizIdx}`, 'boredom');
  };

  const handleFinishQuiz = () => {
    recordAction('quiz_completed', 'boredom');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mini Quiz" maxWidth="lg">
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8">Loading Quiz...</div>
        ) : quizzes.length > 0 ? (
          <div className="mt-4 p-4 border rounded space-y-6 max-h-[400px] overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {quizzes.map((quiz, idx) => (
              <div key={idx} className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{quiz.question}</p>
                <ul className="space-y-2">
                  {quiz.options && quiz.options.map((opt) => (
                    <li key={opt}>
                      <button
                        className={`
                          py-2 px-4 border rounded-md w-full text-left transition-colors duration-200
                          ${selected[idx] === opt 
                            ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-white border-blue-300' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600'}
                          ${selected[idx] ? 'cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}
                        `}
                        onClick={() => handleAnswer(idx, opt)}
                        disabled={!!selected[idx]}
                      >
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
                {results[idx] && <p className={`mt-3 font-bold text-sm ${results[idx].startsWith('Correct') ? 'text-green-600' : 'text-red-600'}`}>{results[idx]}</p>}
                {quiz.raw && (
                  <pre className="text-xs mt-2 text-gray-500 dark:text-gray-400 overflow-auto whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-2 rounded-md border border-dashed dark:border-gray-700">{quiz.raw}</pre>
                )}
              </div>
            ))}
            <div className="text-center mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={handleFinishQuiz}
                className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800"
              >
                Finish Quiz
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-600 dark:text-gray-400">
            No quizzes available.
          </div>
        )}
      </div>
    </Modal>
  );
};


const ReadingInterface: React.FC = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [showEndSessionPrompt, setShowEndSessionPrompt] = useState(false);
  const [showSessionReport, setShowSessionReport] = useState(false);
  const [completedSession, setCompletedSession] = useState<Session | null>(null);
  const [readingTime, setReadingTime] = useState(0);
  const [isBreakInitiated, setIsBreakInitiated] = useState(false); 
  const [showConfusionChat, setShowConfusionChat] = useState(false); 
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [webgazerStatusMessage, setWebgazerStatusMessage] = useState<string | null>(null);
  const [isCameraStopping, setIsCameraStopping] = useState(false); 

  const [topicInfo, setTopicInfo] = useState<string>('');
  const [loadingInfo, setLoadingInfo] = useState<boolean>(false);
  const [infoError, setInfoError] = useState<string>('');

  const { startSession, endSession } = useSession();
  const { setCurrentEmotion, dismissEmotionAction, showEmotionAction, currentEmotion } = useEmotion();
  const navigate = useNavigate();

  // Refs for accumulating gaze data and emotion probabilities
  const gazeDataRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const fixationDurationsRef = useRef<number[]>([]);
  const saccadeDurationsRef = useRef<number[]>([]);
  const saccadeAmplitudesRef = useRef<number[]>([]);
  const blinkDurationsRef = useRef<number[]>([]);
  const microsaccadeCountRef = useRef<number>(0);
  const fixationStartRef = useRef<number | null>(null);
  const blinkStartRef = useRef<number | null>(null);
  const emotionProbsHistoryRef = useRef<EmotionProbs[]>([]);
  const allSessionEmotionProbsRef = useRef<EmotionProbs[]>([]);
  const featureIntervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Store the MediaStream object we initially obtained
  const initialMediaStreamRef = useRef<MediaStream | null>(null); 
  // Store a reference to WebGazer's internal stream if we can get it
  const webgazerInternalStreamRef = useRef<MediaStream | null>(null);


  // ───────────── WEBGAZER CONTROL FUNCTIONS ─────────────

  const removeWebgazerElementsFromDOM = useCallback(() => {
    const idsToRemove = [
      'webgazerVideoContainer', 'webgazerVideoFeed', 'webgazerCanvas', 'webgazerFaceOverlay',
      'webgazerIdealCameraFeedback', 'webgazerPoints',
    ];
    idsToRemove.forEach(id => {
      const element = document.getElementById(id);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
        console.log(`🗑️ Removed WebGazer element: #${id}`);
      }
    });
  }, []);

  const pauseWebGazer = useCallback(() => {
    if (!window.webgazer) return;
    window.webgazer.pause();
    window.webgazer.showVideo(false);
    window.webgazer.showFaceOverlay(false);
    window.webgazer.showFaceFeedbackBox(false);
    window.webgazer.showPredictionPoints(false);
    console.log('⏸️ WebGazer paused.');
  }, []);

  const resumeWebGazer = useCallback(() => {
    if (!window.webgazer) return;
       window.webgazer.resume();
    window.webgazer.showVideo(true);
    window.webgazer.showFaceOverlay(true);
    window.webgazer.showFaceFeedbackBox(true);
    window.webgazer.showPredictionPoints(false);
    console.log('▶️ WebGazer resumed.');
  }, []);

  const stopWebGazer = useCallback(async () => {
    console.log('🛑 Initiating WebGazer STOP sequence...');
    setIsCameraStopping(true); 

    // 1. Attempt WebGazer's own end() method
    if (window.webgazer && typeof window.webgazer.end === 'function') {
      console.log('Attempting window.webgazer.end() for full cleanup.');
      window.webgazer.end();
    } else if (window.webgazer) {
      console.log('window.webgazer.end() not found, proceeding with manual pause.');
      window.webgazer.pause();
    } else {
        console.warn('WebGazer object not found at all during stop. Cannot call end/pause.');
    }
    
    // 2. Clear gaze listener to prevent further data collection
    if (window.webgazer) {
        window.webgazer.clearGazeListener();
    }

    // 3. Explicitly stop tracks from the WebGazer video element's source object if it exists
    // This is crucial as WebGazer might bind its own internal stream to this element.
    const webgazerVideoFeed = document.getElementById('webgazerVideoFeed') as HTMLVideoElement | null;
    if (webgazerVideoFeed) {
        console.log('Found #webgazerVideoFeed element. Attempting to stop its stream.');
        if (webgazerVideoFeed.srcObject instanceof MediaStream) {
            console.log('Pausing video and detaching srcObject from #webgazerVideoFeed...');
            webgazerVideoFeed.pause();
            webgazerVideoFeed.srcObject.getTracks().forEach(track => {
                if (track.readyState === 'live') {
                    track.stop();
                    console.log(`Stopped WebGazer video track: ${track.kind} (${track.id}) from #webgazerVideoFeed.`);
                }
            });
            webgazerVideoFeed.srcObject = null; // Crucial: Detach the stream from the video element
        } else {
            console.log('webgazerVideoFeed did not have an active MediaStream srcObject or it was already detached.');
        }
    } else {
        console.log('No #webgazerVideoFeed element found.');
    }
    
    // 4. Stop the initially obtained stream (if it's still active)
    // This is the stream we acquired with getUserMedia before passing to webgazer.begin()
    if (initialMediaStreamRef.current) {
        console.log('Stopping the initially obtained MediaStream tracks...');
        initialMediaStreamRef.current.getTracks().forEach(track => {
            if (track.readyState === 'live') {
                track.stop();
                console.log(`Stopped initial stream track: ${track.kind} (${track.id}).`);
            }
        });
        initialMediaStreamRef.current = null; // Clear the reference
    } else {
        console.log('No initially obtained MediaStream to stop.');
    }

    // 5. Aggressive cleanup: Enumerate *all* media streams and stop video tracks.
    // This is the most robust way to ensure all active camera streams are released across the browser context.
    if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function' && typeof navigator.mediaDevices.getUserMedia === 'function') {
        try {
            console.log('Attempting to enumerate ALL active media tracks and stop video tracks...');
            // A common pattern is to re-request a dummy stream to "get" active tracks, then stop them.
            // This can sometimes re-prompt if permissions are not persistent or if the browser
            // loses track of active streams. However, it's a strong attempt to release resources.
            // We request a new stream briefly only to get its tracks and stop them.
            const tempStreamForCleanup = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            console.log('Successfully obtained temporary stream for aggressive cleanup.');
            tempStreamForCleanup.getTracks().forEach(track => {
                if (track.kind === 'video' && track.readyState === 'live') {
                    track.stop();
                    console.log(`Stopped aggressive cleanup track: ${track.kind} (${track.id}).`);
                }
            });
        } catch (err) {
            console.warn('Error during aggressive media stream cleanup (expected if no active streams or permissions issue):', err);
        }
    } else {
        console.warn('navigator.mediaDevices.enumerateDevices or getUserMedia not fully supported for universal track stopping.');
    }

    // 6. Call WebGazer.clearAllData() for a deeper internal reset
    if (window.webgazer && typeof window.webgazer.clearAllData === 'function') {
        console.log('Calling window.webgazer.clearAllData() for deeper reset.');
        window.webgazer.clearAllData();
    } else {
        console.warn('window.webgazer.clearAllData() not found. Skipping deeper reset.');
    }

    // 7. Ensure all WebGazer related DOM elements are removed
    removeWebgazerElementsFromDOM();
    
    setWebgazerStatusMessage(null); // Clear status message on stop
    console.log('🛑 WebGazer STOP sequence complete. Webcam light SHOULD turn off now.');
    
    // Add a slight delay before setting isCameraStopping to false, to allow hardware to disengage
    setTimeout(() => {
        setIsCameraStopping(false);
        console.log('✅ Camera stopping process completed and state reset after delay.');
    }, 2000); // Increased delay to 2 seconds for more robust hardware disengagement
  }, [removeWebgazerElementsFromDOM]);

  const startWebGazer = useCallback(async () => {
    console.log('🚀 startWebGazer function invoked.'); // NEW: Initial log for entry point

    // Defensive reset of stream references
    initialMediaStreamRef.current = null;
    webgazerInternalStreamRef.current = null;

    if (isCameraStopping) { 
        setWebgazerStatusMessage('Please wait, camera is still stopping from previous session.');
        console.log('Blocked startWebGazer: Camera is currently in stopping process.');
        return;
    }

    if (!window.webgazer) {
      console.warn('❌ WebGazer not found on window. Check script load.');
      setWebgazerStatusMessage('WebGazer script not loaded. Please ensure webgazer.js is correctly linked in your index.html.');
      return;
    }

    // Display initial status immediately
    setWebgazerStatusMessage('Attempting to start eye tracking...');
    console.log('Step 1: Set initial WebGazer status message.');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ Browser does not support MediaDevices.getUserMedia (camera access).');
      setWebgazerStatusMessage('Your browser does not support camera access, which is required for eye tracking. Please use a modern browser like Chrome or Firefox.');
      return;
    }

    let streamToUse: MediaStream | null = null;
    try {
      console.log('Step 2: Requesting camera access via navigator.mediaDevices.getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      initialMediaStreamRef.current = stream; 
      streamToUse = stream;
      console.log('✅ Step 2.1: Camera access granted. Stored MediaStream. Ready to pass to WebGazer.begin().');

    } catch (err) {
      console.error('❌ Step 2.2: Failed to get camera access:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setWebgazerStatusMessage('Camera access denied. Please enable camera permissions for this site in your browser settings to use eye tracking.');
      } else {
        setWebgazerStatusMessage('Could not access your camera. Please ensure no other application is using it and try again. Error: ' + (err as Error).message);
      }
      return; 
    }

    // Clean up any lingering WebGazer elements before starting new ones
    removeWebgazerElementsFromDOM(); 
    console.log('Step 3: Cleaned up old WebGazer DOM elements.');

    try {
      console.log('Step 4: Calling window.webgazer.begin() with the acquired stream...');
      // Pass the obtained stream to WebGazer.begin(). This should make WebGazer use our stream.
      window.webgazer.begin(streamToUse); 
      console.log('✅ Step 4.1: WebGazer.begin() called. Starting isReady polling...');
      
      window.webgazer.setGazeListener((data: { x: number; y: number; confidence?: number } | null, _timestamp: number) => {
          if (!data) return;
          gazeDataRef.current.push({ x: data.x, y: data.y, t: Date.now() });
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
          if (last) {
              const dx2 = data.x - last.x;
              const dy2 = data.y - last.y;
              const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
              if (dist2 < 50) {
                  if (fixationStartRef.current === null) {
                      fixationStartRef.current = last.t;
                  } else if (Date.now() - fixationStartRef.current > 200) {
                      fixationDurationsRef.current.push(Date.now() - fixationStartRef.current);
                      fixationStartRef.current = null;
                  }
              } else {
                  fixationStartRef.current = null;
              }
          }
          if (data.confidence !== undefined) {
              if (data.confidence < 0.2 && blinkStartRef.current === null) {
                  blinkStartRef.current = Date.now();
              } else if (blinkStartRef.current !== null && data.confidence >= 0.2) {
                  blinkDurationsRef.current.push(Date.now() - blinkStartRef.current);
                  blinkStartRef.current = null;
              }
          }
      });

      const checkWebgazerReady = () => {
        // Ensure webgazer and its isReady method exist and are callable
        if (window.webgazer && typeof window.webgazer.isReady === 'function' && window.webgazer.isReady()) {
          console.log('✅ Step 5: WebGazer isReady triggered. Elements should now be in DOM.');
          setWebgazerStatusMessage('Eye tracking started. Calibrate by looking at the screen.');

          const elementsToStyle = [
              'webgazerVideoContainer', 'webgazerVideoFeed', 'webgazerCanvas', 
              'webgazerFaceOverlay', 'webgazerFaceFeedbackBox', 'webgazerPoints'
          ];
          
          elementsToStyle.forEach(id => {
              const el = document.getElementById(id);
              if (el) {
                  el.style.setProperty('display', 'block', 'important');
                  el.style.setProperty('z-index', '9999999', 'important'); 
                  el.style.setProperty('position', 'fixed', 'important'); 
                  el.style.setProperty('left', '20px', 'important');
                  el.style.setProperty('bottom', '20px', 'important');
                  el.style.setProperty('right', 'auto', 'important');
                  el.style.setProperty('top', 'auto', 'important');
                  el.style.setProperty('opacity', '1', 'important');
                  el.style.setProperty('visibility', 'visible', 'important');
                  el.style.setProperty('background-color', 'transparent', 'important');
                  if (el.tagName === 'VIDEO' && !(el as HTMLVideoElement).autoplay) { // Ensure video auto-plays if not already set
                      (el as HTMLVideoElement).autoplay = true;
                      (el as HTMLVideoElement).play().catch(e => console.warn('Video auto-play failed:', e));
                  }
                  console.log(`Applied aggressive styles to #${id}`);
              } else {
                  console.warn(`WebGazer element #${id} STILL not found after isReady. This is unexpected.`);
              }
          });

          // Explicitly call WebGazer's show methods for good measure
          window.webgazer.showVideo(true);
          window.webgazer.showFaceOverlay(true);
          window.webgazer.showFaceFeedbackBox(true);
          window.webgazer.showPredictionPoints(false); 
          console.log('✅ Step 6: WebGazer visuals explicitly requested via show methods (after isReady).');

          // Try to get WebGazer's internal stream reference once ready
          const videoEl = document.getElementById('webgazerVideoFeed') as HTMLVideoElement | null;
          if (videoEl && videoEl.srcObject instanceof MediaStream) {
              webgazerInternalStreamRef.current = videoEl.srcObject;
              console.log('✅ Stored WebGazer internal stream reference.');
          }

        } else {
          if (window.webgazer && typeof window.webgazer.isReady !== 'function') {
              console.error('WebGazer.isReady() is not a function. WebGazer version or setup might be problematic.');
              setWebgazerStatusMessage('WebGazer encountered an internal error. Please try refreshing the page or check console.');
              return; 
          }
          console.log('Step 5: WebGazer not yet ready, polling again...');
          setTimeout(checkWebgazerReady, 200); 
        }
      };

      checkWebgazerReady(); // Start polling

    } catch (err) {
      console.error('❌ Step 4.2: Error during WebGazer initialization (after camera access):', err);
      setWebgazerStatusMessage('An error occurred while starting eye tracking. Please check your console for details.');
    }
  }, [removeWebgazerElementsFromDOM, isCameraStopping]);


  // ───────────── COMPUTE + SEND FEATURES EVERY 10s ─────────────
  const computeAndSendFeatures = useCallback(async () => {
    const fixDurs = [...fixationDurationsRef.current];
    const sacDurs = [...saccadeDurationsRef.current];
    const sacAmps = [...saccadeAmplitudesRef.current];
    const blinkDurs = [...blinkDurationsRef.current];
    const microCnt = microsaccadeCountRef.current;

    fixationDurationsRef.current = [];
    saccadeDurationsRef.current = [];
    saccadeAmplitudesRef.current = [];
    blinkDurationsRef.current = [];
    microsaccadeCountRef.current = 0;

    const numFix = fixDurs.length;
    const meanFix = numFix ? average(fixDurs) : 0;
    const sdFix = numFix ? stdev(fixDurs) : 0;

    const numSac = sacDurs.length;
    const meanSac = numSac ? average(sacDurs) : 0;
    const meanAmp = sacAmps.length ? average(sacAmps) : 0;

    const numBlink = blinkDurs.length;
    const meanBlink = numBlink ? average(blinkDurs) : 0;

    const featureVector = [
      numFix, parseFloat(meanFix.toFixed(2)), parseFloat(sdFix.toFixed(2)),
      numSac, parseFloat(meanSac.toFixed(2)), parseFloat(meanAmp.toFixed(2)),
      numBlink, parseFloat(meanBlink.toFixed(2)), microCnt,
    ];

    try {
      const response = await fetch('http://localhost:5000/api/emotion-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: featureVector }),
      });
      if (!response.ok) {
        console.error('❌ Server error during emotion prediction:', await response.text());
        return;
      }
      const json = await response.json();
      const probs: EmotionProbs = json.emotionProbs;
      console.log('📶 Received emotion probabilities:', probs);

      emotionProbsHistoryRef.current.push(probs); 
      allSessionEmotionProbsRef.current.push(probs); 

      if (emotionProbsHistoryRef.current.length === 12) {
        decideAndTriggerAdaptiveAction();
      }
    } catch (err) {
      console.error('❌ Failed to POST features for emotion prediction:', err);
    }
  }, []);

  const decideAndTriggerAdaptiveAction = useCallback(() => {
    const allProbs = emotionProbsHistoryRef.current;
    if (allProbs.length === 0) return;

    const numClasses = allProbs[0].length;
    const sumProbs = new Array<number>(numClasses).fill(0);

    allProbs.forEach((vec) => {
      for (let i = 0; i < numClasses; i++) {
        sumProbs[i] += vec[i];
      }
    });

    const avgProbs = sumProbs.map((s) => s / allProbs.length);

    let bestIdx = 0;
    for (let i = 1; i < avgProbs.length; i++) {
      if (avgProbs[i] > avgProbs[bestIdx]) bestIdx = i;
    }

    const emotionLabels: EmotionType[] = ['boredom', 'confusion', 'fatigue', 'focus'];
    const chosenEmotion: EmotionType = emotionLabels[bestIdx];
    console.log('🔍 Dominant emotion (2 min window):', chosenEmotion);

    setCurrentEmotion(chosenEmotion);
    pauseWebGazer();
    setIsPaused(true);
  }, [setCurrentEmotion, pauseWebGazer, setIsPaused]);

  // ───────────── USE EFFECTS ─────────────

  useEffect(() => {
    if (featureIntervalIdRef.current) {
      clearInterval(featureIntervalIdRef.current);
      featureIntervalIdRef.current = null;
      console.log('🛑 Existing feature sending interval cleared for re-evaluation.');
    }
    if (sessionStarted && !isPaused) {
      console.log('✅ Feature sending interval starting.');
      featureIntervalIdRef.current = setInterval(() => {
        computeAndSendFeatures();
      }, 10_000);
    } else {
      console.log('--- Feature sending interval inactive (session not started or paused).');
    }
    return () => {
      if (featureIntervalIdRef.current) {
        clearInterval(featureIntervalIdRef.current);
        featureIntervalIdRef.current = null;
        console.log('🛑 Feature sending interval cleaned up on unmount/dependency change.');
      }
    };
  }, [sessionStarted, isPaused, computeAndSendFeatures]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (sessionStarted && !isPaused) {
      interval = setInterval(() => setReadingTime((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionStarted, isPaused]);

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
    } catch (err: any) {
      setInfoError('Failed to fetch topic info: ' + err.message);
      console.error('Failed to fetch topic info:', err);
    }
    setLoadingInfo(false);
  };

  useEffect(() => {
    if (!showEmotionAction && currentEmotion === null) {
        if (emotionProbsHistoryRef.current.length > 0) {
            console.log('Clearing 2-min emotion history after overlay dismissal.');
            emotionProbsHistoryRef.current = [];
        }
        if (sessionStarted && isPaused && !isBreakInitiated) {
            console.log('Resuming session (overlay dismissed, not a timed break).');
            setIsPaused(false);
            resumeWebGazer();
        }
    }
  }, [showEmotionAction, sessionStarted, currentEmotion, isPaused, isBreakInitiated, resumeWebGazer, setIsPaused]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfusionChatRequest = () => {
    console.log('Opening Confusion Chat Modal...');
    setShowConfusionChat(true);
  };

  const sendQuestionToChatbot = async (question: string): Promise<string> => {
    try {
      const response = await fetch('http://localhost:5000/api/emotion-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotion: 'confusion',
          action: 'topicinfo',
          topic: question
        })
      });
      const data = await response.json();
      return data.content || "Sorry, I couldn't find any information.";
    } catch (error) {
      console.error("Error asking question to AI assistant:", error);
      return 'Error connecting to the assistant. Please try again.';
    }
  };

  const handleBoredomQuizRequest = (topic: string) => {
    console.log('Opening Quiz Modal for topic:', topic);
    setShowQuizModal(true);
  };


  // ───────────── START / END SESSION ─────────────
  const handleStartSession = () => {
    if (!topicName.trim()) {
      alert('Please enter a topic name'); 
      return;
    }
    if (isCameraStopping) { 
        alert('Please wait, camera is still stopping from previous session. Try again in a moment.');
        return;
    }

    startSession(topicName);
    setSessionStarted(true);
    setIsPaused(false);
    setReadingTime(0);
    allSessionEmotionProbsRef.current = [];
    emotionProbsHistoryRef.current = [];
    setIsBreakInitiated(false);
    setShowConfusionChat(false);
    setShowQuizModal(false);
    setWebgazerStatusMessage(null); // Clear any previous WebGazer error messages

    startWebGazer(); 
  };

  const handleEndSession = () => {
    setShowEndSessionPrompt(false);

    if (breakTimerRef.current) {
        clearTimeout(breakTimerRef.current);
        breakTimerRef.current = null;
    }
    setIsBreakInitiated(false);

    stopWebGazer(); 

    if (featureIntervalIdRef.current) {
      clearInterval(featureIntervalIdRef.current);
      featureIntervalIdRef.current = null;
      console.log('Feature sending interval explicitly cleared on session end.');
    }

    const finalOverallEmotionProbs: number[] = [];
    if (allSessionEmotionProbsRef.current.length > 0) {
        const numClasses = allSessionEmotionProbsRef.current[0].length;
        const sumProbs = new Array<number>(numClasses).fill(0);

        allSessionEmotionProbsRef.current.forEach(probArray => {
            probArray.forEach((prob, index) => {
                sumProbs[index] += prob;
            });
        });

        for (let i = 0; i < numClasses; i++) {
            finalOverallEmotionProbs.push(sumProbs[i] / allSessionEmotionProbsRef.current.length);
        }
    }
    console.log('📊 Final overall emotion probabilities for session:', finalOverallEmotionProbs);

    const session = endSession({ finalEmotionProbabilities: finalOverallEmotionProbs });
    setCompletedSession(session);
    setShowSessionReport(true);

    gazeDataRef.current = [];
    fixationDurationsRef.current = [];
    saccadeDurationsRef.current = [];
    blinkDurationsRef.current = [];
    microsaccadeCountRef.current = 0;
    fixationStartRef.current = null;
    blinkStartRef.current = null;
    emotionProbsHistoryRef.current = [];
    allSessionEmotionProbsRef.current = [];

    setSessionStarted(false);
    setIsPaused(false);
    setReadingTime(0);
    setShowConfusionChat(false);
    setShowQuizModal(false);

    dismissEmotionAction();
  };

  const handleCloseReport = () => {
    setShowSessionReport(false);
    navigate('/dashboard');
  };

  const handleTakeBreak = (seconds: number) => {
    if (!sessionStarted) return;

    console.log(`Taking a break for ${seconds} seconds...`);
    setIsPaused(true);
    pauseWebGazer();
    setIsBreakInitiated(true);

    if (breakTimerRef.current) {
      clearTimeout(breakTimerRef.current);
    }

    breakTimerRef.current = setTimeout(() => {
      console.log('Break duration ended. Resuming session.');
      setIsPaused(false);
      resumeWebGazer();
      breakTimerRef.current = null;
      setIsBreakInitiated(false);
    }, seconds * 1000);
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
              disabled={!topicName.trim() || isCameraStopping} 
            >
              {isCameraStopping ? 'Stopping Camera...' : 'Start Reading Session'}
            </Button>
          </div>
          {webgazerStatusMessage && (
            <div className="mt-4 p-3 rounded-md bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm">
              {webgazerStatusMessage}
            </div>
          )}
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
          {webgazerStatusMessage && (
            <div className="mb-4 p-3 rounded-md bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm">
              {webgazerStatusMessage}
            </div>
          )}
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

      {/* Emotion overlay (fixed position for alerts/responses) */}
      <EmotionResponseOverlay
        onTakeBreak={handleTakeBreak}
        onConfusionChatRequest={handleConfusionChatRequest}
        onBoredomQuizRequest={handleBoredomQuizRequest}
        topic={topicName} 
      />

      {/* End session confirmation modal */}
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

      {/* Session report modal */}
      {showSessionReport && completedSession && (
        <SessionReportModal
          isOpen={showSessionReport}
          onClose={handleCloseReport}
          session={completedSession}
        />
      )}

      {/* Confusion Chat Modal */}
      <ConfusionChatModal
        isOpen={showConfusionChat}
        onClose={() => setShowConfusionChat(false)}
        onSendQuestion={sendQuestionToChatbot}
        topic={topicName}
      />

      {/* Quiz Modal */}
      <QuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        topic={topicName}
      />
    </div>
  );
};

export default ReadingInterface;
