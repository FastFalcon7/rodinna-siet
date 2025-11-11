import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * VideoPlayer - Inline video prehrávač pre Chat
 * S thumbnail a play button
 */
function VideoPlayer({ src, thumbnail, name, onFullscreen }) {
  const { darkMode } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ maxWidth: '85%', maxHeight: '400px' }}>
      {!isPlaying ? (
        // Thumbnail s play button
        <div
          className="relative cursor-pointer group"
          onClick={() => setIsPlaying(true)}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={name || 'Video thumbnail'}
              className="w-full h-auto max-h-[400px] object-cover"
            />
          ) : (
            <div className={`w-full h-64 flex items-center justify-center ${
              darkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              <i className="fas fa-video text-6xl text-gray-400"></i>
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-play text-indigo-600 text-2xl ml-1"></i>
            </div>
          </div>

          {/* Video info */}
          {name && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
              <p className="text-white text-sm truncate">{name}</p>
            </div>
          )}
        </div>
      ) : (
        // Video player
        <div className="relative">
          <video
            src={src}
            controls
            autoPlay
            className="w-full h-auto max-h-[400px]"
            style={{ maxWidth: '100%' }}
          >
            Váš prehliadač nepodporuje prehrávanie videa.
          </video>

          {/* Fullscreen button */}
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="absolute top-2 right-2 p-2 bg-gray-900 bg-opacity-75 text-white rounded-lg hover:bg-opacity-100 transition-all"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              <i className="fas fa-expand"></i>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
