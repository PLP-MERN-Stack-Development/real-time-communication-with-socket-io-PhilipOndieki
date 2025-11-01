// src/components/chat/NewChatModal.jsx - Modal for creating new chats
import { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { X, Search, User, Hash, Users, Plus } from 'lucide-react';

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
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">New Chat</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-gray-200 flex gap-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'rooms'
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Hash className="w-4 h-4 inline mr-2" />
              Rooms
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-cyan-500 text-white'
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
                <div className="p-4 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery.trim() ? 'No users found' : 'Search for users to start chatting'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <button
                          key={user.id || user._id}
                          onClick={() => handleUserClick(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-semibold">
                              {user.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900">{user.username}</p>
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
              <div className="h-full overflow-y-auto p-4">
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No public rooms available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rooms.map((room) => (
                      <button
                        key={room._id || room.id}
                        onClick={() => handleRoomClick(room)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white">
                          <Hash className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">{room.name}</p>
                          {room.description && (
                            <p className="text-sm text-gray-500">{room.description}</p>
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
              <div className="h-full overflow-y-auto p-6">
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Name *
                    </label>
                    <input
                      type="text"
                      value={roomForm.name}
                      onChange={(e) =>
                        setRoomForm({ ...roomForm, name: e.target.value })
                      }
                      placeholder="Enter room name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={roomForm.description}
                      onChange={(e) =>
                        setRoomForm({ ...roomForm, description: e.target.value })
                      }
                      placeholder="What's this room about?"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={roomForm.isPrivate}
                      onChange={(e) =>
                        setRoomForm({ ...roomForm, isPrivate: e.target.checked })
                      }
                      className="w-4 h-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
                    />
                    <label htmlFor="isPrivate" className="text-sm text-gray-700">
                      Make this room private (invite-only)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={creating || !roomForm.name.trim()}
                    className="w-full bg-cyan-500 text-white py-3 rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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