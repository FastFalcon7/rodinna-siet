import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function Calendar() {
  const { darkMode } = useTheme();
  const [events] = useState([]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            December 2024
          </h2>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <i className="fas fa-plus mr-2"></i>
            Pridať udalosť
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <div 
              key={day}
              className={`text-center py-2 rounded-lg cursor-pointer transition-colors ${
                day === 25 
                  ? 'bg-indigo-600 text-white' 
                  : darkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div>
          <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Nadchádzajúce udalosti
          </h3>
          <div className="space-y-2">
            {events.map(event => (
              <div 
                key={event.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    event.type === 'birthday' ? 'bg-pink-500' :
                    event.type === 'school' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                    {event.title}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{event.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;