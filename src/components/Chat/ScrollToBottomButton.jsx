import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ScrollToBottomButton - Button na scroll na spodok (zobrazí sa pri scrolle nahor)
 */
function ScrollToBottomButton({ onClick, unreadCount = 0 }) {
  const { darkMode } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-24 right-8 z-10 p-4 rounded-full shadow-2xl transition-all hover:scale-110 ${
        darkMode
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
      } animate-scale-in`}
      style={{
        boxShadow: '0 10px 40px rgba(79, 70, 229, 0.4)'
      }}
    >
      <i className="fas fa-chevron-down text-xl"></i>
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export default ScrollToBottomButton;
