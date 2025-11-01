// src/context/SocketContext.jsx - Socket.io context provider
import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket, initializeSocket, disconnectSocket } from '../socket/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Initialize socket
        const socketInstance = initializeSocket(token);
        setSocket(socketInstance);

        // Connect to socket server
        socketInstance.connect();

        // Socket event listeners
        socketInstance.on('connect', () => {
          console.log('✅ Socket connected:', socketInstance.id);
          setIsConnected(true);
          setConnectionError(null);
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('❌ Socket disconnected:', reason);
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setConnectionError(error.message);
          setIsConnected(false);
        });

        socketInstance.on('error', (error) => {
          console.error('Socket error:', error);
          setConnectionError(error.message);
        });

        // Cleanup
        return () => {
          socketInstance.off('connect');
          socketInstance.off('disconnect');
          socketInstance.off('connect_error');
          socketInstance.off('error');
        };
      }
    } else if (socket) {
      // Disconnect socket if user logs out
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  const value = {
    socket,
    isConnected,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};