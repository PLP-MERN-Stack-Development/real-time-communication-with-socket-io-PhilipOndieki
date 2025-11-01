// src/App.jsx - Main application component with routing
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;