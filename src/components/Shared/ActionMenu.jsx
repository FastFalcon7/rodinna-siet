import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ActionMenu - Trojbodkové menu pre akcie
 * Používa sa v Feed, Chat, a iných komponentoch
 */
function ActionMenu({ actions, position = "right" }) {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleActionClick = (action) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
          darkMode
            ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
        style={{
          WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
          touchAction: 'manipulation'
        }}
      >
        <i className="fas fa-ellipsis-h"></i>
      </button>

      {isOpen && (
        <div
          className={`absolute ${position === 'right' ? 'right-0' : 'left-0'} top-10 ${
            darkMode ? 'bg-gray-700' : 'bg-white'
          } rounded-lg shadow-lg border ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          } py-2 min-w-[160px] z-20`}
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center ${
                action.danger
                  ? 'text-red-600'
                  : darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}
              style={{
                WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
                touchAction: 'manipulation'
              }}
            >
              {action.icon && <i className={`${action.icon} mr-3`}></i>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActionMenu;
