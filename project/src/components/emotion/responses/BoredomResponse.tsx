import React, { useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import Button from '../../ui/Button';
import { fetchQuiz, QuizData } from '../../../api/quizApi';

interface BoredomResponseProps {
  topic?: string;
  onAction?: (actionType: string) => void;
}

const BoredomResponse: React.FC<BoredomResponseProps> = ({ topic, onAction }) => {
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [selected, setSelected] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleQuiz = async () => {
    onAction?.('start_quiz');
    setLoading(true);
    setResults({});
    setSelected({});
    setQuizzes([]);
    const fetchedQuizzes = await fetchQuiz(topic || 'general knowledge');
    setQuizzes(fetchedQuizzes);
    setLoading(false);
  };

  const handleAnswer = (quizIdx: number, option: string) => {
    setSelected(prev => ({ ...prev, [quizIdx]: option }));
    setResults(prev => ({
      ...prev,
      [quizIdx]: quizzes[quizIdx] && option === quizzes[quizIdx].answer
        ? "Correct! 🎉"
        : `Oops! The correct answer is ${quizzes[quizIdx]?.answer}.`
    }));
    onAction?.(`answered_question_${quizIdx}`);
  };

  const handleFinishQuiz = () => {
    onAction?.('quiz_completed');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
          <Brain className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Looking for a challenge?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            We noticed you might be getting bored. How about a quick activity?
          </p>
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleQuiz}
          icon={<Sparkles size={16} />}
          disabled={loading}
        >
          {loading ? "Loading Quiz..." : "Take a Mini Quiz"}
        </Button>
      </div>
      {quizzes.length > 0 && (
        <div className="mt-4 p-4 border rounded space-y-6 max-h-[350px] overflow-y-auto">
          <h4 className="font-semibold mb-2">Quiz Time!</h4>
          {quizzes.map((quiz, idx) => (
            <div key={idx} className="mb-4">
              <p>{quiz.question}</p>
              <ul className="space-y-1">
                {quiz.options && quiz.options.map((opt) => (
                  <li key={opt}>
                    <button
                      className="py-1 px-3 border rounded"
                      onClick={() => handleAnswer(idx, opt)}
                      disabled={!!selected[idx]}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
              {results[idx] && <p className="mt-2 font-bold">{results[idx]}</p>}
              {quiz.raw && (
                <pre className="text-xs mt-2 text-gray-500">{quiz.raw}</pre>
              )}
            </div>
          ))}
          <Button
            variant="primary"
            size="md"
            onClick={handleFinishQuiz}
            className="mt-2"
          >
            Finish Quiz
          </Button>
        </div>
      )}
    </div>
  );
};

export default BoredomResponse;
