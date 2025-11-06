// src/utils/notifications.js - Browser notifications and sound alerts utility

class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.soundEnabled = true;
    this.notificationSound = null;
    this.initSound();
  }

  // Initialize notification sound
  initSound() {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    this.playNotificationSound = () => {
      if (!this.soundEnabled) return;

      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    };
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  // Show browser notification
  showNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    if (Notification.permission === 'granted') {
      const defaultOptions = {
        icon: '/echolia-icon.png', // Add your app icon
        badge: '/echolia-badge.png', // Add your badge icon
        vibrate: [200, 100, 200],
        tag: 'echolia-message',
        renotify: true,
        requireInteraction: false,
        ...options,
      };

      try {
        const notification = new Notification(title, defaultOptions);

        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        return notification;
      } catch (error) {
        console.error('Error showing notification:', error);
        return null;
      }
    }

    return null;
  }

  // Show new message notification
  showMessageNotification(sender, message, isPrivate = false) {
    const title = isPrivate 
      ? `New message from ${sender}` 
      : `${sender} in chat`;
    
    let body = message.content;
    
    // Format body based on message type
    if (message.messageType === 'image') {
      body = '📷 Photo';
    } else if (message.messageType === 'audio') {
      body = '🎤 Voice message';
    } else if (message.messageType === 'file') {
      body = '📎 File';
    }

    const notification = this.showNotification(title, {
      body: body,
      icon: message.sender?.avatar || '/default-avatar.png',
    });

    // Play sound
    this.playNotificationSound();

    return notification;
  }

  // Show typing notification (subtle)
  showTypingNotification(user) {
    // Only show if user is not on the page
    if (document.hidden) {
      this.showNotification(`${user} is typing...`, {
        silent: true,
        requireInteraction: false,
      });
    }
  }

  // Show user joined notification
  showUserJoinedNotification(username, roomName) {
    this.showNotification('User Joined', {
      body: `${username} joined ${roomName}`,
      silent: true,
    });
  }

  // Show user left notification
  showUserLeftNotification(username, roomName) {
    this.showNotification('User Left', {
      body: `${username} left ${roomName}`,
      silent: true,
    });
  }

  // Toggle sound
  toggleSound(enabled) {
    this.soundEnabled = enabled;
    localStorage.setItem('echolia_sound_enabled', enabled);
  }

  // Get sound state
  isSoundEnabled() {
    const stored = localStorage.getItem('echolia_sound_enabled');
    return stored === null ? true : stored === 'true';
  }

  // Check if notifications are supported
  isSupported() {
    return 'Notification' in window;
  }

  // Get permission status
  getPermission() {
    return Notification.permission;
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;


// React hook for easy usage
export const useNotifications = () => {
  const [permission, setPermission] = useState(notificationManager.getPermission());
  const [soundEnabled, setSoundEnabled] = useState(notificationManager.isSoundEnabled());

  const requestPermission = async () => {
    const granted = await notificationManager.requestPermission();
    setPermission(notificationManager.getPermission());
    return granted;
  };

  const toggleSound = (enabled) => {
    notificationManager.toggleSound(enabled);
    setSoundEnabled(enabled);
  };

  return {
    permission,
    soundEnabled,
    requestPermission,
    toggleSound,
    showMessageNotification: notificationManager.showMessageNotification.bind(notificationManager),
    showTypingNotification: notificationManager.showTypingNotification.bind(notificationManager),
    showUserJoinedNotification: notificationManager.showUserJoinedNotification.bind(notificationManager),
    showUserLeftNotification: notificationManager.showUserLeftNotification.bind(notificationManager),
    isSupported: notificationManager.isSupported(),
  };
};