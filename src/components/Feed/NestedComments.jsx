import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * NestedComments - Komentáre s možnosťou odpovedí (replies)
 */
function NestedComments({ comments = [], onAddReply, onLikeComment }) {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState({});

  const handleAddReply = (commentId) => {
    if (!replyText.trim()) return;

    const reply = {
      id: Date.now().toString(),
      author: user.name,
      authorUid: user.uid,
      content: replyText.trim(),
      timestamp: 'Práve teraz',
      likes: 0,
      replies: []
    };

    onAddReply(commentId, reply);
    setReplyText('');
    setReplyingTo(null);
    setShowReplies(prev => ({ ...prev, [commentId]: true }));
  };

  const toggleReplies = (commentId) => {
    setShowReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const renderComment = (comment, depth = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const marginLeft = depth * 40; // Indent pre nested comments

    return (
      <div key={comment.id} className="animate-fade-in" style={{ marginLeft: `${marginLeft}px` }}>
        <div className="flex space-x-3">
          <img
            src={comment.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author)}&background=random&color=fff`}
            alt={comment.author}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <div className="flex-1">
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-3 shadow-sm`}>
              <p className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {comment.author}
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {comment.content}
              </p>
            </div>

            {/* Comment actions */}
            <div className="flex items-center space-x-4 ml-3 mt-1">
              <span className="text-xs text-gray-500">
                {comment.timestamp}
              </span>

              {/* Like */}
              <button
                onClick={() => onLikeComment(comment.id)}
                className={`text-xs font-medium transition-colors ${
                  comment.likedByMe
                    ? 'text-indigo-600'
                    : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className={`${comment.likedByMe ? 'fas' : 'far'} fa-heart mr-1`}></i>
                {comment.likes > 0 && `${comment.likes}`}
              </button>

              {/* Reply */}
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className={`text-xs font-medium ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Odpovedať
              </button>

              {/* Show/hide replies */}
              {hasReplies && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className={`text-xs font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
                >
                  <i className={`fas fa-comment mr-1`}></i>
                  {showReplies[comment.id] ? 'Skryť' : 'Zobraziť'} odpovede ({comment.replies.length})
                </button>
              )}
            </div>

            {/* Reply input */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex space-x-2 animate-scale-in">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full"
                />
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Odpoveď pre ${comment.author}...`}
                    className={`flex-1 p-2 rounded-lg text-sm ${
                      darkMode
                        ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    } border focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                    autoFocus
                  />
                  <button
                    onClick={() => handleAddReply(comment.id)}
                    disabled={!replyText.trim()}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Render nested replies */}
            {hasReplies && showReplies[comment.id] && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {comments.map((comment) => renderComment(comment))}
    </div>
  );
}

export default NestedComments;
