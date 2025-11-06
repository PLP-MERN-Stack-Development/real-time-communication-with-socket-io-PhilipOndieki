// src/pages/Chat.jsx - Enhanced chat page with divider line
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/chat/Sidebar';
import ConversationArea from '../components/chat/ConversationArea';
import notificationManager from '../utils/notifications';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';

const Chat = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const { isConnected } = useChat();
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Request notification permission on mount
  useEffect(() => {
    if (isAuthenticated) {
      const requestNotifications = async () => {
        const permission = await notificationManager.requestPermission();
        setNotificationPermission(notificationManager.getPermission());
      };
      
      // Delay request to avoid interrupting user
      setTimeout(requestNotifications, 3000);
    }

    // Load sound preference
    setSoundEnabled(notificationManager.isSoundEnabled());
  }, [isAuthenticated]);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    notificationManager.toggleSound(newState);
  };

  const requestNotificationPermission = async () => {
    const granted = await notificationManager.requestPermission();
    setNotificationPermission(notificationManager.getPermission());
    
    if (granted) {
      alert('Notifications enabled! You\'ll now receive alerts for new messages.');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="spinner mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white relative">
      {/* Sidebar with Messages List + Divider Line (Desktop) */}
      <Sidebar />
      
      {/* Main Conversation Area */}
      <ConversationArea />

      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-full shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <p className="text-xs font-medium">Reconnecting</p>
          </div>
        </div>
      )}

      {/* Notification Settings Button (Desktop) */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="hidden md:block fixed bottom-6 right-6 p-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all z-50 no-select"
        title="Notification Settings"
      >
        <Bell className="w-5 h-5 text-gray-700" />
      </button>

      {/* Settings Popup */}
      {showSettings && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSettings(false)}
          />
          <div className="fixed bottom-20 right-6 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 w-72 animate-fade-in">
            <h3 className="font-semibold text-gray-900 mb-4">Notification Settings</h3>
            
            {/* Browser Notifications */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                {notificationPermission === 'granted' ? (
                  <Bell className="w-5 h-5 text-green-600" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-sm text-gray-900">Browser Notifications</p>
                  <p className="text-xs text-gray-500">
                    {notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="text-xs px-3 py-1 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                >
                  Enable
                </button>
              )}
            </div>

            {/* Sound Notifications */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-sm text-gray-900">Sound Alerts</p>
                  <p className="text-xs text-gray-500">
                    {soundEnabled ? 'On' : 'Off'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundEnabled ? 'bg-black' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;