// src/components/chat/ConversationArea.jsx - iOS-inspired conversation area with full-screen mobile support
import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  Paperclip,
  MoreVertical,
  ArrowLeft,
  Loader2,
  X,
  Mic,
  Plus,
  Smile
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { uploadAPI } from '../../utils/api';

const ConversationArea = () => {
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    sendMessage,
    sendPrivateMessage,
    loadMessages,
    sendTypingIndicator,
    typingUsers,
    setActiveConversation
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageContainerRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);
    }
  }, [activeConversation, loadMessages]);

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(activeConversation, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(activeConversation, false);
    }, 2000);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
    
    setShowAttachMenu(false);
  };

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle message send
  const handleSendMessage = async () => {
    if (!messageInput.trim() && !selectedFile) return;
    if (!activeConversation) return;

    let fileUrl = null;
    let messageType = 'text';

    // Upload file if selected
    if (selectedFile) {
      setUploading(true);
      try {
        const response = await uploadAPI.uploadFile(selectedFile);
        fileUrl = response.data.data.url;
        messageType = response.data.data.fileType;
      } catch (error) {
        console.error('File upload failed:', error);
        alert('Failed to upload file');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const content = messageInput.trim() || `Sent a ${messageType}`;

    // Send message
    if (activeConversation.type === 'room') {
      sendMessage(activeConversation.id, content, messageType, fileUrl);
    } else {
      sendPrivateMessage(activeConversation.id, content, messageType, fileUrl);
    }

    // Clear input and file
    setMessageInput('');
    clearFileSelection();
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(activeConversation, false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get typing indicator text
  const getTypingText = () => {
    if (!activeConversation) return null;
    
    const key = activeConversation.type === 'room' 
      ? activeConversation.id 
      : activeConversation.id;
    
    const typingUser = typingUsers?.[key];
    
    if (typingUser) {
      return `${typingUser.username} is typing`;
    }
    return null;
  };

  // No conversation selected - COMPLETELY EMPTY
  if (!activeConversation) {
    return (
      <div className="flex-1 bg-white"></div>
    );
  }

  const typingText = getTypingText();

  return (
    <div className="flex-1 flex flex-col bg-white h-screen md:h-auto overflow-hidden">
      {/* Chat Header - iOS Style */}
      <div className="bg-white px-4 md:px-6 py-3 border-b border-gray-100 flex items-center justify-between safe-top flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => setActiveConversation(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 md:hidden touch-feedback no-select"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {activeConversation.avatar ? (
              <img
                src={activeConversation.avatar}
                alt={activeConversation.name}
                className="w-10 h-10 avatar"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {activeConversation.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {activeConversation.isOnline && (
              <span className="online-indicator" style={{ width: '10px', height: '10px' }} />
            )}
          </div>

          {/* Name and Status */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {activeConversation.name}
            </h2>
            <p className="text-xs text-gray-500 truncate">
              {typingText || (activeConversation.isOnline ? 'Online' : 'Offline')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 touch-feedback no-select">
          <MoreVertical className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 bg-white custom-scrollbar"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {!messages || messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-center">No messages yet.<br />Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-1 max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id || message._id || index}
                message={message}
                isOwn={message.sender?.id === user?.id || message.sender?._id === user?.id || message.sender === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Typing Indicator */}
        {typingText && (
          <div className="mt-2 animate-fade-in">
            <TypingIndicator username={typingText} />
          </div>
        )}
      </div>

      {/* File Preview */}
      {uploadPreview && (
        <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-100">
          <div className="relative inline-block">
            <img
              src={uploadPreview}
              alt="Preview"
              className="h-20 rounded-lg"
            />
            <button
              onClick={clearFileSelection}
              className="absolute -top-2 -right-2 p-1 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input - iOS Style */}
      <div className="bg-white px-4 md:px-6 py-3 md:py-4 border-t border-gray-100 safe-bottom flex-shrink-0">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Attachment Menu */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 touch-feedback no-select"
              title="Attach file"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Attachment dropdown */}
            {showAttachMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowAttachMenu(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-20 w-48 animate-fade-in">
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowAttachMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-900 transition-colors flex items-center gap-3"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span>Choose File</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Input Field */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Message"
              className="message-input w-full"
              style={{ paddingRight: '40px' }}
            />
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              onClick={() => {
                // Add emoji picker functionality here
              }}
            >
              <Smile className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Send/Voice Button */}
          {messageInput.trim() || selectedFile ? (
            <button
              onClick={handleSendMessage}
              disabled={uploading}
              className="p-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 touch-feedback no-select"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          ) : (
            <button
              className="p-2.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 touch-feedback no-select"
              onClick={() => {
                // Add voice recording functionality here
                alert('Voice recording feature coming soon!');
              }}
            >
              <Mic className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationArea;