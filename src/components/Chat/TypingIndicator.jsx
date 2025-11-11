import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * TypingIndicator - "Peter píše..." indikátor
 */
function TypingIndicator({ users = [] }) {
  const { darkMode } = useTheme();

  if (users.length === 0) return null;

  const displayText = users.length === 1
    ? `${users[0]} píše...`
    : users.length === 2
    ? `${users[0]} a ${users[1]} píšu...`
    : `${users[0]} a ${users.length - 1} ďalší píšu...`;

  return (
    <div className="flex items-start space-x-2 mb-4 animate-fade-in">
      <div className={`px-4 py-3 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {displayText}
          </span>
          <div className="flex space-x-1">
            <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
