import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * SearchMessages - Fulltext search v správach
 */
function SearchMessages({ messages, onResultClick, onClose }) {
  const { darkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = messages.filter(msg =>
      msg.content?.toLowerCase().includes(query) ||
      msg.sender?.toLowerCase().includes(query)
    );

    setSearchResults(results);
  }, [searchQuery, messages]);

  const highlightText = (text, query) => {
    if (!query || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-300 dark:bg-yellow-600 rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className={`absolute inset-0 z-20 ${darkMode ? 'bg-gray-800' : 'bg-white'} flex flex-col`}>
      {/* Search Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hľadať správy..."
            autoFocus
            className={`flex-1 px-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-800'
            } focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchQuery.trim().length < 2 ? (
          <div className="text-center py-8">
            <i className={`fas fa-search text-4xl mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}></i>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Zadajte minimálne 2 znaky
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-8">
            <i className={`fas fa-inbox text-4xl mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}></i>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Žiadne výsledky pre "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nájdených {searchResults.length} {searchResults.length === 1 ? 'správa' : searchResults.length < 5 ? 'správy' : 'správ'}
            </p>
            {searchResults.map((msg) => (
              <button
                key={msg.id}
                onClick={() => {
                  onResultClick(msg);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={msg.avatar}
                    alt={msg.sender}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {msg.sender}
                    </p>
                    <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {highlightText(msg.content, searchQuery)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {msg.createdAt?.toDate?.()?.toLocaleString?.('sk-SK') || 'Práve teraz'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchMessages;
