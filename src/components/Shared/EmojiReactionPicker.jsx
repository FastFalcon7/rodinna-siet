import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * EmojiReactionPicker - Univerzálny emoji picker pre reakcie
 *
 * Features:
 * - Dynamické pozicionovanie (vždy viditeľný na obrazovke)
 * - Touch-optimized pre iOS/Android
 * - Zabráni text selection
 * - Overlay pre zatvorenie
 *
 * @param {Object} props
 * @param {Array} props.emojis - Zoznam emoji na zobrazenie (default: ['👍', '❤️', '😂', '😮', '😢', '👏', '🎉'])
 * @param {Function} props.onSelect - Callback pri výbere emoji (emoji) => void
 * @param {Function} props.onClose - Callback pri zatvorení
 * @param {Object} props.anchorElement - Element pri ktorom sa má picker zobraziť (pre positioning)
 * @param {boolean} props.isVisible - Viditeľnosť pickeru
 */
function EmojiReactionPicker({
  emojis = ['👍', '❤️', '😂', '😮', '😢', '👏', '🎉'],
  onSelect,
  onClose,
  anchorElement,
  isVisible
}) {
  const { darkMode } = useTheme();
  const pickerRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (!isVisible || !anchorElement || !pickerRef.current) return;

    // Vypočítaj pozíciu pickeru
    const calculatePosition = () => {
      const anchorRect = anchorElement.getBoundingClientRect();
      const pickerRect = pickerRef.current.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = anchorRect.top - pickerRect.height - 12; // 12px gap
      let left = anchorRect.left + (anchorRect.width / 2) - (pickerRect.width / 2);

      // Ak picker ide mimo obrazovky navrchu, zobraz ho dole
      if (top < 10) {
        top = anchorRect.bottom + 12;
      }

      // Ak picker ide mimo obrazovky navrchu (aj po posunutí dole), centruj vertikálne
      if (top + pickerRect.height > viewportHeight - 10) {
        top = viewportHeight / 2 - pickerRect.height / 2;
      }

      // Ak picker ide mimo obrazovky vľavo
      if (left < 10) {
        left = 10;
      }

      // Ak picker ide mimo obrazovky vpravo
      if (left + pickerRect.width > viewportWidth - 10) {
        left = viewportWidth - pickerRect.width - 10;
      }

      setPosition({ top, left });
    };

    calculatePosition();

    // Recalculate on resize/orientation change
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('orientationchange', calculatePosition);

    // Trigger animation
    requestAnimationFrame(() => {
      setAnimationClass('scale-100 opacity-100');
    });

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('orientationchange', calculatePosition);
    };
  }, [isVisible, anchorElement]);

  useEffect(() => {
    if (!isVisible) {
      setAnimationClass('');
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleEmojiClick = (emoji) => {
    // Haptic feedback na mobile (ak je podporované)
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    onSelect(emoji);
  };

  return (
    <>
      {/* Overlay - zatvorí picker pri kliknutí/touch kdekoľvek */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onTouchStart={(e) => {
          e.preventDefault();
          onClose();
        }}
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none'
        }}
      />

      {/* Emoji Picker */}
      <div
        ref={pickerRef}
        className={`fixed z-50 transition-all duration-200 ease-out transform ${animationClass}`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transformOrigin: 'center',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          // Initial state pre animation
          ...(animationClass === '' && {
            transform: 'scale(0.8)',
            opacity: 0
          })
        }}
      >
        <div
          className={`${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
          } rounded-2xl shadow-2xl p-3 flex space-x-2 border-2`}
          style={{
            // Glassmorphism effect
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.95)' : 'rgba(255, 255, 255, 0.95)'
          }}
        >
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEmojiClick(emoji);
              }}
              className={`
                text-3xl p-2 rounded-xl
                transition-all duration-150 ease-out
                hover:scale-125 active:scale-110
                ${darkMode ? 'hover:bg-gray-600 active:bg-gray-500' : 'hover:bg-gray-100 active:bg-gray-200'}
              `}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                cursor: 'pointer',
                // Väčší touch target pre mobile
                minWidth: '48px',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default EmojiReactionPicker;
