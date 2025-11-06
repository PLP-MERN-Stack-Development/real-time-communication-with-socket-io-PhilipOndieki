// src/components/chat/NewChatModal.jsx - iOS-inspired modal for creating new chats
import { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { X, Search, User, Hash, Plus } from 'lucide-react';

const NewChatModal = ({ onClose }) => {
  const {
    searchUsers,
    searchResults,
    createRoom,
    joinRoom,
    openDirectChat,
    fetchPublicRooms,
    rooms,
  } = useChat();

  const [activeTab, setActiveTab] = useState('users'); // 'users', 'rooms', 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (activeTab === 'rooms') {
      fetchPublicRooms();
    }
  }, [activeTab, fetchPublicRooms]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim() && activeTab === 'users') {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, activeTab, searchUsers]);

  const handleUserClick = (user) => {
    openDirectChat(user);
    onClose();
  };

  const handleRoomClick = (room) => {
    joinRoom(room._id || room.id);
    onClose();
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.name.trim()) return;

    setCreating(true);
    try {
      const newRoom = await createRoom(roomForm);
      if (newRoom) {
        joinRoom(newRoom._id || newRoom.id);
        onClose();
      }
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
        <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-2xl md:max-h-[80vh] flex flex-col animate-slide-in h-[90vh] md:h-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-900">New Chat</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-feedback"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-gray-100 flex gap-3 overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                activeTab === 'rooms'
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Hash className="w-4 h-4 inline mr-2" />
              Rooms
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                activeTab === 'create'
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Create Room
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="h-full flex flex-col">
                {/* Search */}
                <div className="p-4 border-b border-gray-50 flex-shrink-0">
                  <div className="search-bar">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {searchResults.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      {searchQuery.trim() ? 'No users found' : 'Search for users to start chatting'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((user, index) => (
                        <button
                          key={user.id || user._id}
                          onClick={() => handleUserClick(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors touch-feedback animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-12 h-12 avatar"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {user.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900">{user.username}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rooms Tab */}
            {activeTab === 'rooms' && (
              <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                {rooms.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No public rooms available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rooms.map((room, index) => (
                      <button
                        key={room._id || room.id}
                        onClick={() => handleRoomClick(room)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors touch-feedback animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                          <Hash className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900">{room.name}</p>
                          {room.description && (
                            <p className="text-sm text-gray-500 truncate">{room.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {room.members?.length || 0} members
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create Room Tab */}
            {activeTab === 'create' && (
              <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                <form onSubmit={handleCreateRoom} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Room Name *
                    </label>
                    <input
                      type="text"
                      value={roomForm.name}
                      onChange={(e) =>
                        setRoomForm({ ...roomForm, name: e.target.value })
                      }
                      placeholder="Enter room name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Description
                    </label>
                    <textarea
                      value={roomForm.description}
                      onChange={(e) =>
                        setRoomForm({ ...roomForm, description: e.target.value })
                      }
                      placeholder="What's this room about?"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black resize-none transition"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={roomForm.isPrivate}
                      onChange={(e) =>
                        setRoomForm({ ...roomForm, isPrivate: e.target.checked })
                      }
                      className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <label htmlFor="isPrivate" className="text-sm text-gray-700 flex-1">
                      Make this room private (invite-only)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={creating || !roomForm.name.trim()}
                    className="w-full bg-black text-white py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-feedback"
                  >
                    {creating ? 'Creating...' : 'Create Room'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NewChatModal;