import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useGroups } from '../../../contexts/GroupContext';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * GroupList - Zoznam skupín a DM v sidebar
 */
function GroupList({ onSelectGroup, onCreateGroup }) {
  const { darkMode } = useTheme();
  const { groups, activeGroup, setActiveGroup } = useGroups();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' alebo 'dm'

  const handleSelectGroup = (group) => {
    setActiveGroup(group);
    onSelectGroup(group);
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Chaty
          </h3>
          <button
            onClick={onCreateGroup}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            style={{
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'groups'
                ? 'bg-indigo-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-users mr-2"></i>
            Skupiny
          </button>
          <button
            onClick={() => setActiveTab('dm')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'dm'
                ? 'bg-indigo-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <i className="fas fa-comment mr-2"></i>
            Správy
          </button>
        </div>
      </div>

      {/* Groups/DM List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'groups' ? (
          groups.length === 0 ? (
            <div className="p-4 text-center">
              <i className={`fas fa-users text-4xl mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}></i>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Zatiaľ nemáte žiadne skupiny
              </p>
              <button
                onClick={onCreateGroup}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                Vytvoriť skupinu
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeGroup?.id === group.id
                      ? 'bg-indigo-100 dark:bg-indigo-900'
                      : darkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div className="flex-1 text-left">
                    <p className={`font-medium text-sm ${
                      activeGroup?.id === group.id
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : darkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {group.name}
                    </p>
                    <p className={`text-xs truncate ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {group.members?.length || 0} členov
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          // DM placeholder
          <div className="p-4 text-center">
            <i className={`fas fa-comment text-4xl mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}></i>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Priame správy budú dostupné čoskoro
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupList;
