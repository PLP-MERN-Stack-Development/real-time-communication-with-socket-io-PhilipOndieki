// src/components/chat/MessageBubble.jsx - Individual message bubble
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

const MessageBubble = ({ message, isOwn }) => {
  const formatTime = (date) => {
    try {
      return format(new Date(date), 'HH:mm');
    } catch (e) {
      return '';
    }
  };

  const renderContent = () => {
    if (message.messageType === 'image' && message.fileUrl) {
      return (
        <div className="max-w-xs">
          <img
            src={message.fileUrl}
            alt="Shared image"
            className="rounded-lg w-full"
          />
          {message.content && message.content !== 'Sent a image' && (
            <p className="mt-2">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.messageType === 'file' && message.fileUrl) {
      return (
        <div className="flex items-center gap-3">
          <p className="font-medium">{message.content || 'File'}</p>
        </div>
      );
    }

    return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
  };

  // Check if message is read
  const isRead = message.readBy && message.readBy.length > 0;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar - only for received messages */}
        {!isOwn && message.sender && (
          <div className="flex-shrink-0">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-semibold">
                {message.sender.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-black text-white rounded-br-md'
              : 'bg-gray-100 text-black rounded-bl-md'
          }`}
        >
          {/* Content */}
          <div className="text-sm">
            {renderContent()}
          </div>

          {/* Time and Status */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-xs ${isOwn ? 'text-gray-300' : 'text-gray-500'}`}>
              {formatTime(message.createdAt)}
            </span>
            {isOwn && (
              <span className="text-gray-300">
                {isRead ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;