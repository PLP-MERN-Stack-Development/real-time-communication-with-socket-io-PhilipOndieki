// src/context/ChatContext.jsx - Chat state management context
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // State management
  const [rooms, setRooms] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // Axios instance with auth
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token to requests
  api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ==================== API CALLS ====================

  // Fetch public rooms
  const fetchPublicRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/rooms/public');
      setRooms(response.data.data.rooms || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rooms');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's rooms
  const fetchUserRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/rooms/my-rooms');
      setRooms(response.data.data.rooms || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch your rooms');
      console.error('Error fetching user rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch room messages
  const fetchRoomMessages = useCallback(async (roomId, page = 1, limit = 50) => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/room/${roomId}?page=${page}&limit=${limit}`);
      const newMessages = response.data.data.messages || [];
      
      // Reverse messages to show oldest first
      setMessages(newMessages.reverse());
      setError(null);
      return response.data.data.pagination;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch messages');
      console.error('Error fetching messages:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch direct messages
  const fetchDirectMessages = useCallback(async (userId, page = 1, limit = 50) => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/direct/${userId}?page=${page}&limit=${limit}`);
      const newMessages = response.data.data.messages || [];
      
      // Reverse messages to show oldest first
      const reversedMessages = newMessages.reverse();
      
      // Store in direct messages object
      setDirectMessages((prev) => ({
        ...prev,
        [userId]: reversedMessages,
      }));
      
      // Also set as current messages
      setMessages(reversedMessages);
      
      setError(null);
      return response.data.data.pagination;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch direct messages');
      console.error('Error fetching direct messages:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (query) => {
    try {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.data.users || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search users');
      console.error('Error searching users:', err);
    }
  }, []);

  // Get online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await api.get('/users/online');
      setOnlineUsers(response.data.data.users || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching online users:', err);
    }
  }, []);

  // Create room
  const createRoom = useCallback(async (roomData) => {
    try {
      setLoading(true);
      const response = await api.post('/rooms', roomData);
      const newRoom = response.data.data.room;
      
      setRooms((prev) => [newRoom, ...prev]);
      setError(null);
      
      return newRoom;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
      console.error('Error creating room:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload file
  const uploadFile = useCallback(async (file, type = 'file') => {
    try {
      const formData = new FormData();
      formData.append(type, file);

      const response = await api.post(`/upload${type === 'avatar' ? '/avatar' : ''}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file');
      console.error('Error uploading file:', err);
      throw err;
    }
  }, []);

  // ==================== SOCKET HANDLERS ====================

  // Send message to room
  const sendRoomMessage = useCallback(
    (roomId, content, messageType = 'text', fileUrl = null) => {
      if (!socket || !isConnected) {
        setError('Not connected to server');
        return;
      }

      socket.emit(
        'message:send',
        {
          roomId,
          content,
          messageType,
          fileUrl,
        },
        (response) => {
          if (!response.success) {
            setError(response.message || 'Failed to send message');
          }
        }
      );
    },
    [socket, isConnected]
  );

  // Send private message
  const sendPrivateMessage = useCallback(
    (recipientId, content, messageType = 'text', fileUrl = null) => {
      if (!socket || !isConnected) {
        setError('Not connected to server');
        return;
      }

      socket.emit(
        'message:private',
        {
          recipientId,
          content,
          messageType,
          fileUrl,
        },
        (response) => {
          if (!response.success) {
            setError(response.message || 'Failed to send message');
          }
        }
      );
    },
    [socket, isConnected]
  );

  // Start typing indicator
  const startTyping = useCallback(
    (roomId = null, recipientId = null) => {
      if (!socket || !isConnected) return;

      socket.emit('typing:start', { roomId, recipientId });
    },
    [socket, isConnected]
  );

  // Stop typing indicator
  const stopTyping = useCallback(
    (roomId = null, recipientId = null) => {
      if (!socket || !isConnected) return;

      socket.emit('typing:stop', { roomId, recipientId });
    },
    [socket, isConnected]
  );

  // Typing indicator wrapper
  const sendTypingIndicator = useCallback(
    (conversation, isTyping) => {
      if (!conversation) return;

      if (conversation.type === 'room') {
        if (isTyping) {
          startTyping(conversation.id, null);
        } else {
          stopTyping(conversation.id, null);
        }
      } else {
        if (isTyping) {
          startTyping(null, conversation.id);
        } else {
          stopTyping(null, conversation.id);
        }
      }
    },
    [startTyping, stopTyping]
  );

  // Mark message as read
  const markMessageAsRead = useCallback(
    (messageId, roomId = null) => {
      if (!socket || !isConnected) return;

      socket.emit('message:read', { messageId, roomId });
    },
    [socket, isConnected]
  );

  // Add reaction to message
  const addReaction = useCallback(
    (messageId, emoji) => {
      if (!socket || !isConnected) return;

      socket.emit('message:reaction:add', { messageId, emoji }, (response) => {
        if (!response.success) {
          setError(response.message || 'Failed to add reaction');
        }
      });
    },
    [socket, isConnected]
  );

  // Join room
  const joinRoom = useCallback(
    (roomId) => {
      if (!socket || !isConnected) return;

      socket.emit('room:join', { roomId }, (response) => {
        if (response.success) {
          const roomConv = {
            id: response.room._id || response.room.id,
            type: 'room',
            name: response.room.name,
            avatar: null,
            isOnline: false,
          };
          setActiveConversation(roomConv);
          fetchRoomMessages(roomId);
        } else {
          setError(response.message || 'Failed to join room');
        }
      });
    },
    [socket, isConnected, fetchRoomMessages]
  );

  // Leave room
  const leaveRoom = useCallback(
    (roomId) => {
      if (!socket || !isConnected) return;

      socket.emit('room:leave', { roomId });
    },
    [socket, isConnected]
  );

  // Open direct chat
  const openDirectChat = useCallback(
    async (targetUser) => {
      const directConv = {
        id: targetUser.id || targetUser._id,
        type: 'direct',
        name: targetUser.username,
        avatar: targetUser.avatar,
        isOnline: !!onlineUsers.find((u) => u.userId === (targetUser.id || targetUser._id)),
      };
      
      setActiveConversation(directConv);
      
      // Fetch messages for this user
      await fetchDirectMessages(targetUser.id || targetUser._id);
    },
    [fetchDirectMessages, onlineUsers]
  );

  // Load messages helper
  const loadMessages = useCallback(
    async (conversation) => {
      if (!conversation) return;

      if (conversation.type === 'room') {
        await fetchRoomMessages(conversation.id);
      } else if (conversation.type === 'direct') {
        const messagesForUser = directMessages[conversation.id];
        if (!messagesForUser || messagesForUser.length === 0) {
          await fetchDirectMessages(conversation.id);
        } else {
          setMessages(messagesForUser);
        }
      }
    },
    [fetchRoomMessages, fetchDirectMessages, directMessages]
  );

  // ==================== SOCKET EVENT LISTENERS ====================

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Message received in room
    const handleMessageReceive = (data) => {
      if (activeConversation?.type === 'room' && data.roomId === activeConversation.id) {
        setMessages((prev) => [...prev, data.message]);
        
        // Mark as read if chat is active
        if (data.message.sender._id !== user?.id) {
          markMessageAsRead(data.message._id, data.roomId);
        }
      } else {
        // Update unread count
        setUnreadCounts((prev) => ({
          ...prev,
          [data.roomId]: (prev[data.roomId] || 0) + 1,
        }));
      }
    };

    // Private message received
    const handlePrivateMessageReceive = (data) => {
      const otherUserId = data.message.sender._id === user?.id 
        ? data.message.recipient 
        : data.message.sender._id;

      setDirectMessages((prev) => ({
        ...prev,
        [otherUserId]: [...(prev[otherUserId] || []), data.message],
      }));

      // Mark as read if this is the active chat
      if (activeConversation?.type === 'direct' && activeConversation.id === otherUserId) {
        setMessages((prev) => [...prev, data.message]);
        if (data.message.sender._id !== user?.id) {
          markMessageAsRead(data.message._id);
        }
      } else if (data.message.sender._id !== user?.id) {
        // Update unread count for direct messages
        setUnreadCounts((prev) => ({
          ...prev,
          [`direct_${otherUserId}`]: (prev[`direct_${otherUserId}`] || 0) + 1,
        }));
      }
    };

    // Typing indicator update
    const handleTypingUpdate = (data) => {
      const key = data.roomId || data.userId;
      
      setTypingUsers((prev) => {
        const updated = { ...prev };
        
        if (data.isTyping) {
          updated[key] = {
            userId: data.userId,
            username: data.username,
          };
        } else {
          delete updated[key];
        }
        
        return updated;
      });

      // Auto-clear typing after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        }, 3000);
      }
    };

    // User online
    const handleUserOnline = (data) => {
      setOnlineUsers((prev) => {
        // Check if user already exists
        if (prev.find((u) => u.userId === data.userId)) {
          return prev;
        }
        return [...prev, data];
      });
    };

    // User offline
    const handleUserOffline = (data) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    // Message read confirmation
    const handleMessageReadConfirm = (data) => {
      // Update message read status in current messages
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? {
                ...msg,
                readBy: [
                  ...(msg.readBy || []),
                  {
                    user: data.readBy,
                    readAt: data.readAt,
                  },
                ],
              }
            : msg
        )
      );

      // Update in direct messages
      setDirectMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((userId) => {
          updated[userId] = updated[userId].map((msg) =>
            msg._id === data.messageId
              ? {
                  ...msg,
                  readBy: [
                    ...(msg.readBy || []),
                    {
                      user: data.readBy,
                      readAt: data.readAt,
                    },
                  ],
                }
              : msg
          );
        });
        return updated;
      });
    };

    // Reaction update
    const handleReactionUpdate = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );

      // Update in direct messages
      setDirectMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((userId) => {
          updated[userId] = updated[userId].map((msg) =>
            msg._id === data.messageId
              ? { ...msg, reactions: data.reactions }
              : msg
          );
        });
        return updated;
      });
    };

    // User joined room
    const handleUserJoinedRoom = (data) => {
      console.log('User joined room:', data);
    };

    // User left room
    const handleUserLeftRoom = (data) => {
      console.log('User left room:', data);
    };

    // Register all event listeners
    socket.on('message:receive', handleMessageReceive);
    socket.on('message:private:receive', handlePrivateMessageReceive);
    socket.on('typing:update', handleTypingUpdate);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('message:read:confirm', handleMessageReadConfirm);
    socket.on('message:reaction:update', handleReactionUpdate);
    socket.on('room:user:joined', handleUserJoinedRoom);
    socket.on('room:user:left', handleUserLeftRoom);

    // Cleanup
    return () => {
      socket.off('message:receive', handleMessageReceive);
      socket.off('message:private:receive', handlePrivateMessageReceive);
      socket.off('typing:update', handleTypingUpdate);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('message:read:confirm', handleMessageReadConfirm);
      socket.off('message:reaction:update', handleReactionUpdate);
      socket.off('room:user:joined', handleUserJoinedRoom);
      socket.off('room:user:left', handleUserLeftRoom);
    };
  }, [socket, isConnected, activeConversation, user, markMessageAsRead]);

  // Fetch initial data on mount
  useEffect(() => {
    if (user && isConnected) {
      fetchUserRooms();
      fetchOnlineUsers();
    }
  }, [user, isConnected, fetchUserRooms, fetchOnlineUsers]);

  // Clear unread count when opening a chat
  useEffect(() => {
    if (activeConversation) {
      const key = activeConversation.type === 'room' 
        ? activeConversation.id 
        : `direct_${activeConversation.id}`;
      
      setUnreadCounts((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  }, [activeConversation]);

  // Build conversations list from rooms and direct messages
  useEffect(() => {
    // Map rooms to conversation format
    const roomConversations = (rooms || []).map((room) => ({
      id: room._id || room.id,
      type: 'room',
      name: room.name,
      avatar: null,
      isOnline: false,
      lastMessage: room.lastMessage || null,
      lastActivity: room.updatedAt || room.createdAt || new Date(),
    }));

    // Map direct messages to conversation format
    const directConversations = Object.entries(directMessages).map(([userId, messages]) => {
      const user = onlineUsers.find((u) => u.userId === userId) || searchResults.find((u) => (u.id || u._id) === userId);
      const lastMsg = messages[messages.length - 1];
      
      return {
        id: userId,
        type: 'direct',
        name: user?.username || 'Unknown User',
        avatar: user?.avatar || null,
        isOnline: !!onlineUsers.find((u) => u.userId === userId),
        lastMessage: lastMsg || null,
        lastActivity: lastMsg?.createdAt || new Date(),
      };
    });

    const allConversations = [...roomConversations, ...directConversations].sort(
      (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)
    );

    setConversations(allConversations);
  }, [rooms, directMessages, onlineUsers, searchResults]);

  const value = {
    // State
    rooms,
    activeConversation,
    messages,
    directMessages,
    onlineUsers,
    typingUsers,
    unreadCounts,
    searchResults,
    conversations,
    loading,
    error,

    // Actions
    setActiveConversation,
    fetchPublicRooms,
    fetchUserRooms,
    fetchRoomMessages,
    fetchDirectMessages,
    searchUsers,
    fetchOnlineUsers,
    createRoom,
    uploadFile,
    sendMessage: sendRoomMessage,
    sendPrivateMessage,
    sendTypingIndicator,
    startTyping,
    stopTyping,
    markMessageAsRead,
    addReaction,
    joinRoom,
    leaveRoom,
    openDirectChat,
    loadMessages,
    setError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};