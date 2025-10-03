import React, { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * MediaViewer - Lightbox pre zobrazenie médií na celú obrazovku
 * Podporuje obrázky a videá
 */
function MediaViewer({ media, onClose }) {
  const { darkMode } = useTheme();

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!media) return null;

  const isVideo = media.type?.startsWith('video/') || media.url?.match(/\.(mp4|webm|mov)$/i);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-3 bg-gray-800 bg-opacity-75 text-white rounded-full hover:bg-opacity-100 transition-all"
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <i className="fas fa-times text-xl"></i>
      </button>

      {/* Media info */}
      {media.name && (
        <div className="absolute top-4 left-4 z-50 bg-gray-800 bg-opacity-75 text-white px-4 py-2 rounded-lg">
          <p className="text-sm">{media.name}</p>
        </div>
      )}

      {/* Media content */}
      <div
        className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            style={{ maxHeight: '90vh' }}
          >
            Váš prehliadač nepodporuje prehrávanie videa.
          </video>
        ) : (
          <img
            src={media.url}
            alt={media.name || 'Media'}
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            style={{ maxHeight: '90vh' }}
          />
        )}
      </div>

      {/* Download button */}
      <a
        href={media.url}
        download={media.name}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 z-50 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        onClick={(e) => e.stopPropagation()}
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <i className="fas fa-download"></i>
        <span>Stiahnuť</span>
      </a>
    </div>
  );
}

export default MediaViewer;
