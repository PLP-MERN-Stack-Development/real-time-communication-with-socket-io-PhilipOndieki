# 🎵 Echolia Chat Client

A modern, real-time chat application built with React, Socket.io, and Tailwind CSS.

![Echolia Banner](https://ui-avatars.com/api/?name=Echolia&size=200&background=00cbff&color=fff)

## ✨ Features

### Core Features
- ✅ **User Authentication** - JWT-based secure login and registration
- ✅ **Real-Time Messaging** - Instant message delivery using Socket.io
- ✅ **Private Messaging** - One-on-one direct messaging
- ✅ **Group Rooms** - Create and join multiple chat rooms
- ✅ **Online Status** - See who's online in real-time
- ✅ **Typing Indicators** - Know when someone is typing
- ✅ **Read Receipts** - See when messages are read
- ✅ **File Sharing** - Share images and files
- ✅ **Message Reactions** - React to messages with emojis
- ✅ **Unread Message Count** - Track unread messages
- ✅ **Message Search** - Search through chat history
- ✅ **Responsive Design** - Works on desktop and mobile

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Running Echolia backend server

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
client/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   └── chat/         # Chat-specific components
│   │       ├── Sidebar.jsx              # Messages list
│   │       ├── ConversationArea.jsx     # Chat interface
│   │       ├── MessageBubble.jsx        # Message display
│   │       ├── TypingIndicator.jsx      # Typing animation
│   │       └── NewChatModal.jsx         # New chat modal
│   ├── context/          # React Context providers
│   │   ├── AuthContext.jsx              # Authentication state
│   │   └── ChatContext.jsx              # Chat state & Socket.io
│   ├── pages/            # Page components
│   │   ├── Login.jsx                    # Login page
│   │   ├── Register.jsx                 # Registration page
│   │   └── Chat.jsx                     # Main chat page
│   ├── socket/           # Socket.io configuration
│   │   └── socket.js                    # Socket setup
│   ├── utils/            # Utility functions
│   │   └── api.js                       # API client
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── .env                  # Environment variables
├── package.json          # Dependencies
└── README.md            # This file
```

## 🎨 Design System

### Colors
- **Primary (Cyan)**: `#00cbff` - Main brand color
- **Secondary (Blue)**: `#00b8e6` - Accent color
- **Background**: Cyan gradient for chat area
- **Text**: Dark gray for readability
- **White**: For message bubbles and UI elements

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 Key Components

### Sidebar
- Displays all conversations (rooms + direct messages)
- Search functionality
- Unread message badges
- User menu with logout

### ConversationArea
- Message display with sender info
- Real-time typing indicators
- File upload and preview
- Message input with Enter key support
- Voice message display (audio waveform)

### MessageBubble
- White bubbles for both sent and received messages
- Avatar display for received messages
- Time stamps
- Read receipts (checkmarks)
- Image/file previews
- Reaction support

## 🔌 Socket.io Events

### Emitted Events
- `message:send` - Send message to room
- `message:private` - Send private message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `message:read` - Mark message as read
- `message:reaction:add` - Add reaction to message
- `room:join` - Join a room
- `room:leave` - Leave a room

### Received Events
- `message:receive` - New room message
- `message:private:receive` - New private message
- `typing:update` - Typing indicator update
- `user:online` - User came online
- `user:offline` - User went offline
- `message:read:confirm` - Message read confirmation
- `message:reaction:update` - Reaction update

## 🛡️ Authentication Flow

1. User registers/logs in
2. Server returns JWT tokens (access + refresh)
3. Tokens stored in localStorage
4. Access token added to all API requests
5. Socket.io connection authenticated with token
6. Auto-refresh on token expiry

## 🌐 API Integration

All API calls are handled through `src/utils/api.js`:

- **Auth**: `authAPI` - login, register, logout
- **Users**: `userAPI` - search, profile, online users
- **Rooms**: `roomAPI` - create, join, manage rooms
- **Messages**: `messageAPI` - fetch, search messages
- **Upload**: `uploadAPI` - file uploads

## 📝 Usage Examples

### Starting a New Chat
1. Click the "+" button in the sidebar
2. Search for users or create a room
3. Select user/room to start chatting

### Sending Messages
- Type message and press Enter
- Click attach icon to send files
- Messages appear in real-time

### Reactions
- Hover over message (desktop)
- Click to add reaction emoji
- Multiple users can react

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag and drop 'dist' folder to Netlify
```

### Environment Variables
Make sure to set:
- `VITE_API_URL` - Your backend API URL
- `VITE_SOCKET_URL` - Your Socket.io server URL

## 🐛 Troubleshooting

### Socket.io not connecting
- Check if backend server is running
- Verify CORS settings on backend
- Check VITE_SOCKET_URL in .env

### Messages not sending
- Check network tab for API errors
- Verify authentication token is valid
- Check socket connection status

### Styles not loading
- Run `npm install` again
- Clear browser cache
- Check tailwind.config.js

## 📄 License

MIT License - feel free to use this project for learning and development.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Socket.io for real-time communication
- Tailwind CSS for styling
- Lucide React for icons
- React team for the amazing library

---

**Echolia - Where Voices Resonate** 🎵