// src/components/chat/ConversationArea.jsx - Main chat conversation area
import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  File as FileIcon,
  X
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
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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

    const messageData = {
      content: messageInput.trim() || `Sent a ${messageType}`,
      messageType,
      fileUrl,
    };

    // Send message
    if (activeConversation.type === 'room') {
      sendMessage(activeConversation.id, messageData);
    } else {
      sendPrivateMessage(activeConversation.id, messageData);
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
    const key = activeConversation?.type === 'room' 
      ? activeConversation.id 
      : activeConversation?.id;
    const typingUser = typingUsers[key];
    
    if (typingUser) {
      return `${typingUser.username} is typing...`;
    }
    return null;
  };

  // No conversation selected
  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-cyan-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-12 h-12 text-cyan-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Select a conversation
          </h2>
          <p className="text-gray-600">
            Choose a chat from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-cyan-400 h-screen">
      {/* Chat Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveConversation(null)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Avatar */}
          <div className="relative">
            {activeConversation.avatar ? (
              <img
                src={activeConversation.avatar}
                alt={activeConversation.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-semibold">
                {activeConversation.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {activeConversation.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          {/* Name and Status */}
          <div>
            <h2 className="font-semibold text-gray-900">
              {activeConversation.name}
            </h2>
            <p className="text-xs text-gray-500">
              {activeConversation.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Info className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/80">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id || message._id}
                message={message}
                isOwn={message.sender?.id === user?.id || message.sender === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Typing Indicator */}
        {getTypingText() && (
          <div className="mt-4">
            <TypingIndicator username={getTypingText()} />
          </div>
        )}
      </div>

      {/* File Preview */}
      {uploadPreview && (
        <div className="px-6 py-2 bg-white border-t border-gray-200">
          <div className="relative inline-block">
            <img
              src={uploadPreview}
              alt="Preview"
              className="h-20 rounded-lg"
            />
            <button
              onClick={clearFileSelection}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white px-6 py-4 border-t border-gray-200">
        <div className="flex items-end gap-3">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>

          {/* Input Field */}
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none max-h-32"
              style={{ minHeight: '48px' }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={(!messageInput.trim() && !selectedFile) || uploading}
            className="p-3 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationArea;