import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * PinnedMessages - Pripnuté správy v Chate
 */
function PinnedMessages({ pinnedMessages = [], onUnpin, onJumpToMessage }) {
  const { darkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (pinnedMessages.length === 0) return null;

  const displayMessage = pinnedMessages[0];
  const hasMore = pinnedMessages.length > 1;

  return (
    <div className={`${darkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-200'} border-b`}>
      {/* Collapsed view - show first pinned message */}
      {!isExpanded ? (
        <div className="p-3 flex items-center space-x-3">
          <div className="flex-shrink-0">
            <i className="fas fa-thumbtack text-indigo-600 text-lg"></i>
          </div>
          <div
            className="flex-1 cursor-pointer"
            onClick={() => onJumpToMessage(displayMessage.id)}
          >
            <p className={`text-xs font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'} mb-1`}>
              Pripnutá správa
            </p>
            <p className={`text-sm truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <span className="font-medium">{displayMessage.sender}:</span> {displayMessage.content}
            </p>
          </div>
          {hasMore && (
            <button
              onClick={() => setIsExpanded(true)}
              className={`px-3 py-1 text-xs rounded-lg ${
                darkMode
                  ? 'bg-indigo-800 hover:bg-indigo-700 text-indigo-200'
                  : 'bg-indigo-200 hover:bg-indigo-300 text-indigo-800'
              }`}
            >
              +{pinnedMessages.length - 1}
            </button>
          )}
          <button
            onClick={() => onUnpin(displayMessage.id)}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-indigo-800' : 'hover:bg-indigo-200'}`}
          >
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>
      ) : (
        // Expanded view - show all pinned messages
        <div className="max-h-64 overflow-y-auto">
          <div className="p-3 flex items-center justify-between border-b border-indigo-300 dark:border-indigo-700">
            <div className="flex items-center space-x-2">
              <i className="fas fa-thumbtack text-indigo-600"></i>
              <span className={`text-sm font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                Pripnuté správy ({pinnedMessages.length})
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-indigo-800' : 'hover:bg-indigo-200'}`}
            >
              <i className="fas fa-chevron-up text-gray-500"></i>
            </button>
          </div>

          <div className="divide-y divide-indigo-200 dark:divide-indigo-700">
            {pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors`}
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={msg.avatar}
                    alt={msg.sender}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      onJumpToMessage(msg.id);
                      setIsExpanded(false);
                    }}
                  >
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {msg.sender}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {msg.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {msg.createdAt?.toDate?.()?.toLocaleString?.('sk-SK') || 'Práve teraz'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpin(msg.id);
                    }}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-indigo-800' : 'hover:bg-indigo-200'}`}
                  >
                    <i className="fas fa-times text-gray-500"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PinnedMessages;
