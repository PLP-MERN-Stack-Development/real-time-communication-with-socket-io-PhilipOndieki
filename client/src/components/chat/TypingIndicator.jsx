// src/components/chat/TypingIndicator.jsx - Typing indicator animation
const TypingIndicator = ({ username }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      {username && (
        <span className="text-sm text-gray-600">{username}</span>
      )}
    </div>
  );
};

export default TypingIndicator;