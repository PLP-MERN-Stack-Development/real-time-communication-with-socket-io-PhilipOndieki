// src/pages/Chat.jsx - Main chat page with sidebar and conversation area
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/chat/Sidebar';
import ConversationArea from '../components/chat/ConversationArea';

const Chat = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const { isConnected } = useChat();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Sidebar - Messages List */}
      <Sidebar />
      
      {/* Main Conversation Area */}
      <ConversationArea />

      {/* Connection Status Indicator (optional) */}
      {!isConnected && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm font-medium">Reconnecting...</p>
        </div>
      )}
    </div>
  );
};

export default Chat;