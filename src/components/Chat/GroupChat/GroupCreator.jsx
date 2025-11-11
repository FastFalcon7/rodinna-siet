import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useGroups } from '../../../contexts/GroupContext';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';

/**
 * GroupCreator - Modal pre vytvorenie novej skupiny
 */
function GroupCreator({ onClose }) {
  const { darkMode } = useTheme();
  const { createGroup } = useGroups();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Načítanie zoznamu členov rodiny
  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        // Pre demo používame mockované dáta
        // V produkcii by sme načítali z Firebase
        const mockMembers = [
          { uid: 'user2', name: 'Anna Nováková', avatar: 'https://ui-avatars.com/api/?name=Anna+Novakova&background=EC4899&color=fff' },
          { uid: 'user3', name: 'Peter Novák', avatar: 'https://ui-avatars.com/api/?name=Peter+Novak&background=10B981&color=fff' },
          { uid: 'user4', name: 'Jana Nováková', avatar: 'https://ui-avatars.com/api/?name=Jana+Novakova&background=F59E0B&color=fff' },
          { uid: 'user5', name: 'Michal Novák', avatar: 'https://ui-avatars.com/api/?name=Michal+Novak&background=8B5CF6&color=fff' },
        ];

        // Filtrovanie aktuálneho užívateľa
        const filtered = mockMembers.filter(m => m.uid !== user.uid);
        setAvailableMembers(filtered);
      } catch (error) {
        console.error('Error loading members:', error);
      }
    };

    loadFamilyMembers();
  }, [user]);

  const toggleMember = (memberUid) => {
    setSelectedMembers(prev =>
      prev.includes(memberUid)
        ? prev.filter(uid => uid !== memberUid)
        : [...prev, memberUid]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Zadajte názov skupiny');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Vyberte aspoň jedného člena');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        members: selectedMembers
      });
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Chyba pri vytváraní skupiny');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Vytvoriť skupinu
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Group name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Názov skupiny *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Napr. Rodinný chat"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              maxLength={50}
            />
          </div>

          {/* Group description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Popis (voliteľné)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Krátky popis skupiny"
              className={`w-full px-4 py-2 rounded-lg border resize-none ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              rows="3"
              maxLength={200}
            />
          </div>

          {/* Member selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Vyberte členov *
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableMembers.map(member => (
                <button
                  key={member.uid}
                  onClick={() => toggleMember(member.uid)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    selectedMembers.includes(member.uid)
                      ? 'bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-600'
                      : darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <span className={`flex-1 text-left ${
                    selectedMembers.includes(member.uid)
                      ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                      : darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {member.name}
                  </span>
                  {selectedMembers.includes(member.uid) && (
                    <i className="fas fa-check text-indigo-600"></i>
                  )}
                </button>
              ))}
            </div>
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Vybratých: {selectedMembers.length}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex space-x-3`}>
          <button
            onClick={onClose}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } disabled:opacity-50`}
          >
            Zrušiť
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={loading || !groupName.trim() || selectedMembers.length === 0}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Vytváram...
              </>
            ) : (
              'Vytvoriť skupinu'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupCreator;
