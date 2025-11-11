import React, { useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Unified AttachmentButton component
 * Compatible with iPhone Safari, iPad, and desktop
 * Supports images, videos, documents
 */
function AttachmentButton({ onFileSelect, acceptTypes = "image/*,video/*,.pdf,.doc,.docx,.txt", variant = "icon" }) {
  const { darkMode } = useTheme();
  const fileInputRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Kontrola veľkosti súboru (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Súbor je príliš veľký. Maximálna veľkosť je 10MB.');
        return;
      }
      onFileSelect(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    setShowMenu(false);
  };

  // Variant: icon (len ikona), button (tlačidlo s textom), menu (rozbaľovacie menu)
  if (variant === "menu") {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`px-3 py-2 rounded-lg transition-colors ${
            darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          style={{
            WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
            touchAction: 'manipulation'
          }}
        >
          <i className="fas fa-paperclip"></i>
          <span className="ml-2 hidden sm:inline">Priložiť</span>
        </button>

        {showMenu && (
          <div className={`absolute bottom-12 left-0 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'} py-2 min-w-[160px] z-20`}>
            <label
              htmlFor="attachment-image"
              className={`flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
              style={{
                WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
                touchAction: 'manipulation'
              }}
            >
              <i className="fas fa-image mr-3 text-indigo-600"></i>
              Obrázok
            </label>
            <input
              type="file"
              id="attachment-image"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <label
              htmlFor="attachment-video"
              className={`flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
              style={{
                WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
                touchAction: 'manipulation'
              }}
            >
              <i className="fas fa-video mr-3 text-indigo-600"></i>
              Video
            </label>
            <input
              type="file"
              id="attachment-video"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <label
              htmlFor="attachment-doc"
              className={`flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
              style={{
                WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
                touchAction: 'manipulation'
              }}
            >
              <i className="fas fa-file mr-3 text-indigo-600"></i>
              Dokument
            </label>
            <input
              type="file"
              id="attachment-doc"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Overlay to close menu when clicking outside */}
        {showMenu && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    );
  }

  // Icon variant (default)
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        id="attachment-file-input"
        accept={acceptTypes}
      />

      <label
        htmlFor="attachment-file-input"
        className={`${variant === 'button' ? 'px-4 py-2' : 'px-3 py-2'} rounded-lg cursor-pointer transition-colors ${
          darkMode
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }`}
        style={{
          WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
          touchAction: 'manipulation'
        }}
      >
        <i className="fas fa-paperclip"></i>
        {variant === 'button' && <span className="ml-2">Priložiť súbor</span>}
      </label>
    </>
  );
}

export default AttachmentButton;
