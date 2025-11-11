import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * MentionInput - Input s podporou @mentions
 * Automaticky detekuje @ a zobrazí zoznam členov
 */
function MentionInput({
  value,
  onChange,
  onMention,
  members = [],
  placeholder = 'Napíšte správu...',
  className = '',
  onSubmit
}) {
  const { darkMode } = useTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(text);

    // Detekcia @ znaku
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const searchText = textBeforeCursor.substring(lastAtSymbol + 1);
      const hasSpaceAfterAt = searchText.includes(' ');

      if (!hasSpaceAfterAt) {
        // Filter members based on search
        const filtered = members.filter(member =>
          member.name.toLowerCase().includes(searchText.toLowerCase())
        );

        if (filtered.length > 0) {
          setSuggestions(filtered);
          setMentionStart(lastAtSymbol);
          setShowSuggestions(true);
          setSelectedIndex(0);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (member) => {
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(inputRef.current.selectionStart);
    const newValue = `${beforeMention}@${member.name} ${afterMention}`;

    onChange(newValue);
    setShowSuggestions(false);

    // Notify parent about mention
    if (onMention) {
      onMention(member);
    }

    // Focus input
    setTimeout(() => {
      inputRef.current.focus();
      const cursorPos = beforeMention.length + member.name.length + 2;
      inputRef.current.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        if (suggestions.length > 0) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Highlight mentions v texte
  const renderTextWithMentions = () => {
    const mentionRegex = /@(\w+)/g;
    const parts = value.split(mentionRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a username
        return (
          <span key={index} className="text-indigo-600 font-semibold">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        style={{
          WebkitAppearance: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      />

      {/* Mention suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={`absolute bottom-full left-0 mb-2 ${
            darkMode ? 'bg-gray-700' : 'bg-white'
          } rounded-lg shadow-2xl border ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          } py-2 max-h-64 overflow-y-auto z-20`}
          style={{ minWidth: '200px' }}
        >
          {suggestions.map((member, index) => (
            <button
              key={member.uid}
              onClick={() => insertMention(member)}
              className={`w-full text-left px-4 py-2 flex items-center space-x-3 transition-colors ${
                index === selectedIndex
                  ? darkMode
                    ? 'bg-indigo-900 text-white'
                    : 'bg-indigo-100 text-indigo-900'
                  : darkMode
                  ? 'hover:bg-gray-600 text-gray-200'
                  : 'hover:bg-gray-100 text-gray-800'
              }`}
            >
              <img
                src={member.avatar}
                alt={member.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{member.name}</p>
                {member.role && (
                  <p className="text-xs opacity-75">{member.role}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MentionText - Komponent pre zobrazenie textu s highlighted mentions
 */
export function MentionText({ text, className = '', onMentionClick }) {
  const mentionRegex = /@(\w+)/g;
  const parts = text.split(mentionRegex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          // This is a username
          return (
            <span
              key={index}
              className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline"
              onClick={() => onMentionClick && onMentionClick(part)}
            >
              @{part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}

/**
 * useMentionNotifications - Hook pre správu mention notifikácií
 */
export function useMentionNotifications(userId) {
  const [mentions, setMentions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulácia - v produkcii by to bolo z Firebase
  useEffect(() => {
    // Load mentions from Firebase where mentioned user = userId
    // const unsubscribe = onSnapshot(query(...));
    // return unsubscribe;
  }, [userId]);

  const markAsRead = (mentionId) => {
    setMentions(prev =>
      prev.map(m => m.id === mentionId ? { ...m, read: true } : m)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setMentions(prev => prev.map(m => ({ ...m, read: true })));
    setUnreadCount(0);
  };

  return {
    mentions,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}

export default MentionInput;
