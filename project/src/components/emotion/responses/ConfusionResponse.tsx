import React, { useState } from 'react';
import { HelpCircle, Send, X } from 'lucide-react';
import Button from '../../ui/Button';

interface ConfusionResponseProps {
  onAction: (actionType: string) => void;
}

const ConfusionResponse: React.FC<ConfusionResponseProps> = ({ onAction }) => {
  const [showChat, setShowChat] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleOpenChat = () => {
    setShowChat(true);
    onAction('opened_chat');
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  const handleSendMessage = async () => {
    if (!question.trim()) return;

    const userMessage = question.trim();

    // Add user message
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setQuestion('');
    onAction('asked_question');

    try {
      const response = await fetch('http://localhost:5000/api/emotion-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotion: 'confusion',
          action: 'topicinfo',
          topic: userMessage
        })
      });

      const data = await response.json();
      const assistantReply = data?.content || "Sorry, I couldn't find any information.";

      setChatHistory(prev => [...prev, { role: 'assistant', content: assistantReply }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error contacting the assistant.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (showChat) {
    return (
      <div className="w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-purple-600 text-white">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <h3 className="font-medium">AI Assistant</h3>
          </div>
          <button onClick={handleCloseChat}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
              <p>How can I help you understand the material better?</p>
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
          <HelpCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Need some help?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You seem confused. Let me assist you with this material.
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={handleOpenChat}
        fullWidth
        className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 focus:ring-purple-500"
      >
        Get Assistance
      </Button>
    </div>
  );
};

export default ConfusionResponse;
