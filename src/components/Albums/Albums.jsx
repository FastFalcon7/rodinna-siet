import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function Albums() {
  const { darkMode } = useTheme();
  const [albums] = useState([]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Rodinné albumy
        </h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <i className="fas fa-plus mr-2"></i>
          Nový album
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {albums.map(album => (
          <div 
            key={album.id}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden cursor-pointer transform hover:scale-105 transition-transform`}
          >
            <img 
              src={album.cover}
              alt={album.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {album.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {album.photos} fotiek
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Albums;