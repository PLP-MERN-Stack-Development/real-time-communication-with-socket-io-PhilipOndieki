// client/src/components/chat/SearchMessages.jsx - Search through chat messages
import { useState, useEffect } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { messageExtendedAPI } from '../../utils/extendedApi';
import { format } from 'date-fns';

const SearchMessages = ({ onClose, onSelectMessage, activeRoomId = null }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    // Debounce search
    const debounceTimer = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const response = await messageExtendedAPI.searchMessages(query, activeRoomId);
      setResults(response.data.data.messages || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    try {
      return format(new Date(date), 'MMM d, yyyy · h:mm a');
    } catch (e) {
      return '';
    }
  };

  const highlightText = (text) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-black">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center gap-3 safe-top">
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        
        <div className="flex-1 search-bar">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
            className="w-full"
          />
          {query && (
            <button 
              onClick={() => {
                setQuery('');
                setResults([]);
                setSearched(false);
              }}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Search Info */}
      {activeRoomId && (
        <div className="px-6 py-2 bg-gray-50 text-sm text-gray-600">
          Searching in this room only
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner"></div>
            <span className="ml-3 text-gray-600">Searching...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <Search className="w-16 h-16 text-gray-300 mb-4" />
            {!searched ? (
              <>
                <p className="text-gray-600 font-medium mb-2">Search Messages</p>
                <p className="text-gray-500 text-sm">
                  Type at least 2 characters to search
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 font-medium mb-2">No messages found</p>
                <p className="text-gray-500 text-sm">
                  Try a different search term
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-4 md:p-6 space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Found {results.length} {results.length === 1 ? 'message' : 'messages'}
            </p>
            
            {results.map((message, index) => (
              <div
                key={message._id || message.id}
                onClick={() => {
                  onSelectMessage(message);
                  onClose();
                }}
                className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  {message.sender?.avatar ? (
                    <img
                      src={message.sender.avatar}
                      alt={message.sender.username}
                      className="w-8 h-8 avatar"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {message.sender?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {message.sender?.username || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-900 leading-relaxed">
                  {highlightText(message.content)}
                </p>
                
                {message.room && (
                  <p className="text-xs text-gray-500 mt-2">
                    In: {message.room.name || 'Room'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchMessages;