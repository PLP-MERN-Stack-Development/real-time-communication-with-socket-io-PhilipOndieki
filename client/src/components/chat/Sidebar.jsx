// src/components/chat/Sidebar.jsx - iOS-inspired minimalist sidebar
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { 
  Search, 
  Plus, 
  Bell,
  Phone,
  MessageSquare,
  Users,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import NewChatModal from './NewChatModal';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { conversations, activeConversation, setActiveConversation, unreadCounts } = useChat();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState([]);

  // Filter conversations based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter((conv) =>
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const getUnreadCount = (conversation) => {
    const key = conversation.type === 'room' 
      ? conversation.id 
      : `direct_${conversation.id}`;
    return unreadCounts[key] || 0;
  };

  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet';
    
    if (message.messageType === 'text') {
      return message.content;
    } else if (message.messageType === 'image') {
      return '📷 Photo';
    } else if (message.messageType === 'audio') {
      return '🎤 Voice message';
    } else if (message.messageType === 'file') {
      return '📎 File';
    }
    return message.content;
  };

  const formatTime = (date) => {
    if (!date) return '';
    try {
      const distance = formatDistanceToNow(new Date(date), { addSuffix: false });
      
      // Simplify time display
      if (distance.includes('less than')) return 'now';
      if (distance.includes('minute')) {
        const mins = distance.match(/\d+/);
        return mins ? `${mins[0]}m` : '1m';
      }
      if (distance.includes('hour')) {
        const hours = distance.match(/\d+/);
        return hours ? `${hours[0]}h` : '1h';
      }
      if (distance.includes('day')) {
        const days = distance.match(/\d+/);
        return days ? `${days[0]}d` : '1d';
      }
      if (distance.includes('week')) return '1w+';
      if (distance.includes('month')) return '1mo+';
      return distance;
    } catch (e) {
      return '';
    }
  };

  // Calculate total unread count
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 bg-white flex-col h-screen ios-rounded-lg md:rounded-none overflow-hidden`}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 safe-top">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative no-select touch-feedback"
              title="Notifications"
            >
              <Bell className="w-6 h-6 text-gray-900" />
              {totalUnread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full badge-pulse" />
              )}
            </button>
            
            {/* User Menu Dropdown */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-5 top-16 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-20 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{user?.username}</p>
                    <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Add settings functionality here
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-gray-900 transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-red-500 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search Bar - iOS Style */}
        <div className="search-bar">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {Array.isArray(filteredConversations) && filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium text-lg mb-2">No conversations yet</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery ? 'No results found' : 'Start a new chat to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewChatModal(true)}
                className="pill-button bg-black text-white hover:bg-gray-800"
              >
                Start Chat
              </button>
            )}
          </div>
        ) : (
          <div className="py-2">
            {(filteredConversations || []).map((conversation, index) => {
              const isActive = activeConversation?.id === conversation.id && 
                             activeConversation?.type === conversation.type;
              const unread = getUnreadCount(conversation);

              return (
                <div
                  key={`${conversation.type}-${conversation.id}`}
                  onClick={() => setActiveConversation(conversation)}
                  className={`px-5 py-3 cursor-pointer transition-all hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50 animate-fade-in ${
                    isActive ? 'bg-gray-50' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conversation.avatar ? (
                        <img
                          src={conversation.avatar}
                          alt={conversation.name}
                          className="w-12 h-12 avatar"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                          {conversation.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {conversation.isOnline && (
                        <span className="online-indicator" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate text-base">
                          {conversation.name}
                        </h3>
                        <span className="timestamp flex-shrink-0 ml-2">
                          {formatTime(conversation.lastActivity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${unread > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                          {formatLastMessage(conversation.lastMessage)}
                        </p>
                        {unread > 0 && (
                          <span className="unread-badge flex-shrink-0 ml-2">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowNewChatModal(true)}
        className="fab md:hidden no-select"
        title="New Chat"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation - iOS Style (Mobile Only) */}
      <div className="md:hidden bottom-nav no-select">
        <button className="p-2 text-white opacity-60 hover:opacity-100 transition-opacity">
          <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 text-white opacity-100">
          <MessageSquare className="w-5 h-5" />
        </button>
        <button className="p-2 text-white opacity-60 hover:opacity-100 transition-opacity">
          <Users className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal onClose={() => setShowNewChatModal(false)} />
      )}
    </div>
  );
};

export default Sidebar;