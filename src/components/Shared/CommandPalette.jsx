import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * CommandPalette - Spotlight-style quick action panel
 *
 * Features:
 * - Cmd/Ctrl + K - otvoriť/zavrieť
 * - Fuzzy search cez všetky akcie
 * - Navigácia šípkami
 * - Enter - vykonať akciu
 * - Esc - zavrieť
 *
 * Actions:
 * - Navigácia medzi sekciami
 * - Rýchle akcie (nový príspevok, nová udalosť, ...)
 * - Prepínanie dark mode
 */
function CommandPalette({ isOpen, onClose, onAction }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredActions, setFilteredActions] = useState([]);

  // Definícia všetkých akcií
  const actions = [
    // Navigácia
    {
      id: 'nav-feed',
      title: 'Prejsť na Feed',
      description: 'Domovská stránka s príspevkami',
      icon: 'fa-home',
      keywords: ['feed', 'domov', 'prispevky', 'home'],
      action: () => {
        navigate('/');
        onClose();
      }
    },
    {
      id: 'nav-chat',
      title: 'Prejsť na Chat',
      description: 'Rodinný chat',
      icon: 'fa-comments',
      keywords: ['chat', 'spravy', 'messages', 'konverzacia'],
      action: () => {
        navigate('/chat');
        onClose();
      }
    },
    {
      id: 'nav-calendar',
      title: 'Prejsť na Kalendár',
      description: 'Rodinné udalosti',
      icon: 'fa-calendar',
      keywords: ['kalendar', 'calendar', 'udalosti', 'events'],
      action: () => {
        navigate('/calendar');
        onClose();
      }
    },
    {
      id: 'nav-albums',
      title: 'Prejsť na Albumy',
      description: 'Fotogaléria',
      icon: 'fa-images',
      keywords: ['albumy', 'albums', 'fotky', 'photos', 'galeria'],
      action: () => {
        navigate('/albums');
        onClose();
      }
    },
    {
      id: 'nav-family',
      title: 'Prejsť na Rodinu',
      description: 'Rodinní členovia',
      icon: 'fa-users',
      keywords: ['rodina', 'family', 'clenovia', 'members'],
      action: () => {
        navigate('/family');
        onClose();
      }
    },
    {
      id: 'nav-settings',
      title: 'Prejsť na Nastavenia',
      description: 'Nastavenia aplikácie',
      icon: 'fa-cog',
      keywords: ['nastavenia', 'settings', 'profil', 'profile'],
      action: () => {
        navigate('/settings');
        onClose();
      }
    },

    // Rýchle akcie
    {
      id: 'action-new-post',
      title: 'Nový príspevok',
      description: 'Vytvoriť nový príspevok vo Feed',
      icon: 'fa-plus-circle',
      keywords: ['novy', 'prispevok', 'post', 'vytvorit'],
      action: () => {
        navigate('/');
        onClose();
        // Trigger modal pre nový príspevok (implementujeme cez custom event)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openNewPostModal'));
        }, 100);
      }
    },
    {
      id: 'action-new-event',
      title: 'Nová udalosť',
      description: 'Vytvoriť novú udalosť v kalendári',
      icon: 'fa-calendar-plus',
      keywords: ['nova', 'udalost', 'event', 'kalendar'],
      action: () => {
        navigate('/calendar');
        onClose();
        // Trigger modal pre novú udalosť
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openNewEventModal'));
        }, 100);
      }
    },

    // Nastavenia
    {
      id: 'toggle-dark-mode',
      title: darkMode ? 'Svetlý režim' : 'Tmavý režim',
      description: `Prepnúť na ${darkMode ? 'svetlý' : 'tmavý'} režim`,
      icon: darkMode ? 'fa-sun' : 'fa-moon',
      keywords: ['dark', 'mode', 'tmavy', 'svetly', 'tema', 'theme'],
      action: () => {
        toggleDarkMode();
        onClose();
      }
    }
  ];

  // Fuzzy search - jednoduchá implementácia
  const fuzzyMatch = (text, query) => {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Presná zhoda
    if (textLower.includes(queryLower)) {
      return true;
    }

    // Fuzzy match - každý znak query musí byť v texte v správnom poradí
    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  // Filter actions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredActions(actions);
      setSelectedIndex(0);
      return;
    }

    const filtered = actions.filter((action) => {
      return (
        fuzzyMatch(action.title, searchQuery) ||
        fuzzyMatch(action.description, searchQuery) ||
        action.keywords.some((keyword) => fuzzyMatch(keyword, searchQuery))
      );
    });

    setFilteredActions(filtered);
    setSelectedIndex(0);
  }, [searchQuery, darkMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input pri otvorení
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredActions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
        }
        break;

      case 'Escape':
        e.preventDefault();
        onClose();
        break;

      default:
        break;
    }
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  // Add keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = document.getElementById(`action-item-${selectedIndex}`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Command Palette */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] pointer-events-none">
        <div
          className={`${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } rounded-2xl shadow-2xl border-2 max-w-2xl w-full mx-4 overflow-hidden pointer-events-auto`}
          style={{
            animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '60vh'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
            <div className="flex items-center space-x-3">
              <i className={`fas fa-search text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Vyhľadať akciu alebo navigáciu..."
                className={`flex-1 bg-transparent text-lg outline-none ${
                  darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
                }`}
                style={{
                  WebkitAppearance: 'none'
                }}
              />
              <kbd className={`px-2 py-1 text-xs rounded ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                ESC
              </kbd>
            </div>
          </div>

          {/* Actions list */}
          <div className="overflow-y-auto max-h-[50vh] py-2">
            {filteredActions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <i className={`fas fa-search text-4xl mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Žiadne výsledky pre "{searchQuery}"
                </p>
              </div>
            ) : (
              filteredActions.map((action, index) => (
                <div
                  key={action.id}
                  id={`action-item-${index}`}
                  onClick={() => action.action()}
                  className={`px-4 py-3 flex items-center space-x-4 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? darkMode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-900'
                      : darkMode
                      ? 'hover:bg-gray-700 text-gray-200'
                      : 'hover:bg-gray-50 text-gray-800'
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    index === selectedIndex
                      ? darkMode
                        ? 'bg-indigo-500'
                        : 'bg-indigo-100'
                      : darkMode
                      ? 'bg-gray-700'
                      : 'bg-gray-100'
                  }`}>
                    <i className={`fas ${action.icon} text-lg`}></i>
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p className="font-medium">{action.title}</p>
                    <p className={`text-sm ${
                      index === selectedIndex
                        ? darkMode
                          ? 'text-indigo-200'
                          : 'text-indigo-700'
                        : darkMode
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}>
                      {action.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  {index === selectedIndex && (
                    <i className="fas fa-arrow-right text-sm"></i>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className={`border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} px-4 py-2`}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'}`}>↑</kbd>
                  <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'} ml-1`}>↓</kbd>
                  {' '}navigovať
                </span>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'}`}>↵</kbd>
                  {' '}vykonať
                </span>
              </div>
              <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-xs`}>
                {filteredActions.length} {filteredActions.length === 1 ? 'akcia' : filteredActions.length < 5 ? 'akcie' : 'akcií'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default CommandPalette;
