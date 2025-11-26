import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  playerId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const QUICK_MESSAGES = [
  '🔥 Let\'s go!',
  '👍 Good race!',
  '😅 Oops!',
  '⚡ Rev those engines!',
  '🏁 See you at the finish!',
  '💪 Catch me if you can!',
];

export default function Chat({ messages, onSendMessage }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-20">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="bg-black/80 backdrop-blur-sm rounded-lg w-80 shadow-2xl">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h3 className="text-white font-bold">Chat</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-red-400"
            >
              ✕
            </button>
          </div>

          <div className="h-64 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-gray-400 text-sm text-center mt-8">
                No messages yet. Say hi! 👋
              </p>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className="bg-white/10 rounded p-2 text-white text-sm"
              >
                <p className="font-bold text-yellow-400 text-xs">{msg.username}</p>
                <p>{msg.message}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-700">
            <div className="flex gap-2 mb-2 flex-wrap">
              {QUICK_MESSAGES.map((quickMsg, index) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(quickMsg)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-all"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="input flex-1 bg-white/10 text-white placeholder-gray-400 border-gray-600"
                maxLength={100}
              />
              <button
                onClick={handleSend}
                disabled={!inputMessage.trim()}
                className="btn btn-primary disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
