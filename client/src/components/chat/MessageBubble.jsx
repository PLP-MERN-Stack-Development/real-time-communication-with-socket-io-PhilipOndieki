// src/components/chat/MessageBubble.jsx - Individual message bubble
import { format } from 'date-fns';
import { Check, CheckCheck, Play, Download } from 'lucide-react';

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
          <div className="p-3 bg-gray-100 rounded-lg">
            <Download className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">{message.content || 'File'}</p>
            <a
              href={message.fileUrl}
              download
              className="text-sm text-cyan-500 hover:underline"
            >
              Download
            </a>
          </div>
        </div>
      );
    }

    if (message.messageType === 'audio' && message.fileUrl) {
      return (
        <div className="flex items-center gap-3 min-w-[200px]">
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <Play className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <div className="h-8 flex items-center">
              {/* Audio waveform visualization - simplified */}
              <div className="flex items-center gap-0.5 h-full">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gray-700 rounded-full"
                    style={{
                      height: `${Math.random() * 70 + 30}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-500">0:00</span>
        </div>
      );
    }

    return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
  };

  // Check if message is read
  const isRead = message.readBy && message.readBy.length > 0;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
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
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                {message.sender.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-2 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-white text-gray-900'
              : 'bg-white text-gray-900'
          }`}
          style={isOwn ? {
            borderBottomRightRadius: '4px',
          } : {
            borderBottomLeftRadius: '4px',
          }}
        >
          {/* Sender name (for group chats, received messages only) */}
          {!isOwn && message.sender && (
            <p className="text-xs font-semibold text-cyan-600 mb-1">
              {message.sender.username}
            </p>
          )}

          {/* Content */}
          <div className="text-sm">
            {renderContent()}
          </div>

          {/* Time and Status */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
            {isOwn && (
              <span className="text-gray-500">
                {isRead ? (
                  <CheckCheck className="w-3 h-3 text-cyan-500" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.reduce((acc, reaction) => {
                const existing = acc.find((r) => r.emoji === reaction.emoji);
                if (existing) {
                  existing.count++;
                } else {
                  acc.push({ emoji: reaction.emoji, count: 1 });
                }
                return acc;
              }, []).map((reaction, index) => (
                <div
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 rounded-full text-xs flex items-center gap-1"
                >
                  <span>{reaction.emoji}</span>
                  {reaction.count > 1 && (
                    <span className="text-gray-600 font-medium">{reaction.count}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;