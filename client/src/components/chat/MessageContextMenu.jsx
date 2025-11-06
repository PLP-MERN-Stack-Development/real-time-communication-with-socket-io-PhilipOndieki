// client/src/components/chat/MessageContextMenu.jsx - Context menu for message actions
import { useState } from 'react';
import { Edit2, Trash2, Copy, Reply, MoreHorizontal } from 'lucide-react';
import { messageExtendedAPI } from '../../utils/extendedApi';

const MessageContextMenu = ({ message, onClose, onEdit, onDelete, isOwn }) => {
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    onEdit(message);
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      setLoading(true);
      try {
        await messageExtendedAPI.deleteMessage(message._id || message.id);
        onDelete(message);
        onClose();
      } catch (error) {
        console.error('Failed to delete message:', error);
        alert('Failed to delete message');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      onClose();
    }
  };

  const handleReply = () => {
    // TODO: Implement reply functionality
    console.log('Reply to:', message);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed bottom-20 right-6 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 w-48 animate-fade-in">
        {isOwn && (
          <button
            onClick={handleEdit}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-900 transition-colors flex items-center gap-3"
          >
            <Edit2 className="w-4 h-4" />
            <span className="font-medium">Edit</span>
          </button>
        )}
        
        <button
          onClick={handleReply}
          className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-900 transition-colors flex items-center gap-3"
        >
          <Reply className="w-4 h-4" />
          <span className="font-medium">Reply</span>
        </button>
        
        <button
          onClick={handleCopy}
          className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-900 transition-colors flex items-center gap-3"
        >
          <Copy className="w-4 h-4" />
          <span className="font-medium">Copy</span>
        </button>
        
        {isOwn && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 text-red-500 transition-colors flex items-center gap-3"
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-medium">{loading ? 'Deleting...' : 'Delete'}</span>
          </button>
        )}
      </div>
    </>
  );
};

export default MessageContextMenu;