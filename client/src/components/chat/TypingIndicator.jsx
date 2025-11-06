// src/components/chat/TypingIndicator.jsx - iOS-inspired typing indicator
const TypingIndicator = ({ username }) => {
  return (
    <div className="flex items-start gap-2 animate-fade-in">
      {/* Small avatar placeholder */}
      <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
      
      {/* Typing bubble */}
      <div className="bg-gray-100 rounded-3xl rounded-bl-lg px-4 py-3 flex items-center gap-1.5">
        <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
        <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
        <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
      </div>
    </div>
  );
};

export default TypingIndicator;