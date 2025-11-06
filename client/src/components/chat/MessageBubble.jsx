// src/components/chat/MessageBubble.jsx - iOS-inspired message bubbles
import { format } from 'date-fns';
import { Check, CheckCheck, Play } from 'lucide-react';

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
            className="rounded-2xl w-full"
            style={{ maxHeight: '300px', objectFit: 'cover' }}
          />
          {message.content && message.content !== 'Sent a image' && (
            <p className="mt-2">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.messageType === 'audio' && message.fileUrl) {
      return (
        <div className="flex items-center gap-3 min-w-[220px]">
          <button 
            className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors flex-shrink-0"
            style={{ width: '44px', height: '44px' }}
          >
            <Play className="w-5 h-5" fill="currentColor" />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <div className="waveform flex-1">
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
            </div>
            <span className="text-xs opacity-70 flex-shrink-0 font-medium">0:15</span>
          </div>
        </div>
      );
    }

    if (message.messageType === 'file' && message.fileUrl) {
      return (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{message.content || 'File'}</p>
            <p className="text-xs opacity-70">Tap to download</p>
          </div>
        </div>
      );
    }

    return <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>;
  };

  // Check if message is read
  const isRead = message.readBy && message.readBy.length > 0;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 message-bubble`}>
      <div className={`flex gap-2 max-w-[75%] md:max-w-[60%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar - only for received messages */}
        {!isOwn && message.sender && (
          <div className="flex-shrink-0 self-end">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.username}
                className="w-7 h-7 avatar"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {message.sender.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Message Bubble - REFINED */}
        <div
          className={`relative rounded-3xl ${
            isOwn
              ? 'bg-black text-white rounded-br-lg'
              : 'bg-gray-100 text-gray-900 rounded-bl-lg'
          }`}
          style={{ 
            maxWidth: '100%',
            padding: '12px 16px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {/* Content */}
          <div className="text-[15px] leading-snug">
            {renderContent()}
          </div>

          {/* Time and Status */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[11px] ${isOwn ? 'text-gray-300' : 'text-gray-500'}`}>
              {formatTime(message.createdAt)}
            </span>
            {isOwn && (
              <span className={`${isRead ? 'text-blue-400' : 'text-gray-300'}`}>
                {isRead ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
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