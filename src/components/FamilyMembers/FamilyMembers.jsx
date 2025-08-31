import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function FamilyMembers() {
  const { darkMode } = useTheme();
  const [members] = useState([]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Členovia rodiny
        </h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <i className="fas fa-user-plus mr-2"></i>
          Pozvať člena
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => (
          <div 
            key={member.id}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src={member.avatar}
                  alt={member.name}
                  className="w-16 h-16 rounded-full"
                />
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 ${
                  darkMode ? 'border-gray-800' : 'border-white'
                } ${
                  member.status === 'online' ? 'bg-green-500' :
                  member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {member.name}
                </h3>
                <p className="text-sm text-gray-500">{member.role}</p>
                <p className={`text-xs mt-1 ${
                  member.status === 'online' ? 'text-green-500' :
                  member.status === 'away' ? 'text-yellow-500' : 'text-gray-400'
                }`}>
                  {member.status === 'online' ? 'Online' :
                   member.status === 'away' ? 'Nedostupný' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FamilyMembers;