import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { storage, db } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { updateUserProfile } from '../../services/userService';

function Settings() {
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  // States pre úpravy
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [initials, setInitials] = useState(getInitialsFromName(user?.name || ''));
  const [avatarBgColor, setAvatarBgColor] = useState('#4F46E5');
  const [loading, setLoading] = useState(false);

  // Funkcia na získanie iniciál z mena
  function getInitialsFromName(name) {
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Prednastavené farby
  const avatarColors = [
    '#4F46E5', // indigo
    '#7C3AED', // purple  
    '#DC2626', // red
    '#EA580C', // orange
    '#CA8A04', // yellow
    '#16A34A', // green
    '#0891B2', // cyan
    '#2563EB', // blue
    '#C026D3', // magenta
    '#65A30D'  // lime
  ];

  // Upload profilovej fotky
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const timestamp = Date.now();
      const fileName = `profiles/${user.uid}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Aktualizuj profil
      await updateUserProfile(user.uid, { avatar: downloadURL });
      
      setShowAvatarEditor(false);
      window.location.reload(); // Reload pre aktualizáciu avatara
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Chyba pri nahrávaní obrázka');
    } finally {
      setLoading(false);
    }
  };

  // Uloženie iniciálového avatara
  const handleSaveInitials = async () => {
    try {
      setLoading(true);
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${avatarBgColor.slice(1)}&color=fff&size=200`;
      
      await updateUserProfile(user.uid, { avatar: avatarUrl });
      
      setShowAvatarEditor(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Chyba pri aktualizácii avatara');
    } finally {
      setLoading(false);
    }
  };

  // Uloženie mena
  const handleSaveName = async () => {
    if (!newName.trim()) return;

    try {
      setLoading(true);
      await updateUserProfile(user.uid, { name: newName });
      
      setEditingName(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Chyba pri aktualizácii mena');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Nastavenia
      </h2>

      {/* Profile Settings */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6 mb-4`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Profil
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <img 
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full"
            />
            <div className="flex flex-col space-y-2">
              {/* Skrytý file input */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="avatar-file-input"
                ref={(el) => {
                  if (el) {
                    window.avatarFileInput = el;
                  }
                }}
              />
              
              {/* Visible tlačidlo ktoré triggeruje file input */}
              <label
                htmlFor="avatar-file-input"
                className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer select-none text-center inline-block ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                style={{ 
                  WebkitTapHighlightColor: 'rgba(79, 70, 229, 0.3)',
                  touchAction: 'manipulation'
                }}
              >
                {loading ? 'Načítavam...' : 'Nahrať fotku'}
              </label>
              
              {/* Alternatívne tlačidlo pre iniciály */}
              <button
                onClick={() => setShowAvatarEditor(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer text-center"
                style={{ 
                  WebkitTapHighlightColor: 'rgba(124, 58, 237, 0.3)',
                  touchAction: 'manipulation'
                }}
              >
                Vytvoriť avatar s inicialmi
              </button>
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Meno
            </label>
            {editingName ? (
              <div className="flex space-x-2">
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={loading}
                >
                  Uložiť
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNewName(user.name);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Zrušiť
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <input 
                  type="text"
                  value={user.name}
                  readOnly
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                />
                <button
                  onClick={() => setEditingName(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Upraviť
                </button>
              </div>
            )}
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input 
              type="email"
              value={user.email}
              readOnly
              className={`w-full px-4 py-2 rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6 mb-4`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Vzhľad
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Tmavý režim
            </p>
            <p className="text-sm text-gray-500">
              Prepnúť medzi svetlým a tmavým režimom
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              darkMode ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              darkMode ? 'translate-x-6' : 'translate-x-1'
            }`}></span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6 mb-4`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Notifikácie
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Push notifikácie
            </span>
            <input type="checkbox" className="rounded" defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Email notifikácie
            </span>
            <input type="checkbox" className="rounded" />
          </label>
          <label className="flex items-center justify-between">
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Zvukové upozornenia
            </span>
            <input type="checkbox" className="rounded" defaultChecked />
          </label>
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={logout}
        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
      >
        Odhlásiť sa
      </button>

      {/* Avatar Editor Modal */}
      {showAvatarEditor && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Zmeniť profilovú fotku
              </h3>
              <button
                onClick={() => setShowAvatarEditor(false)}
                onTouchStart={() => {}}
                className={`text-gray-500 hover:text-gray-700 ${darkMode ? 'hover:text-gray-300' : ''} cursor-pointer`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-6">
              {/* Upload súboru */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nahrať obrázok
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div className="text-center">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  alebo
                </span>
              </div>

              {/* Iniciály */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Iniciály (1-2 písmená)
                </label>
                <input
                  type="text"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.slice(0, 2).toUpperCase())}
                  maxLength="2"
                  className={`w-full px-3 py-2 border rounded-lg text-center text-lg font-bold ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              {/* Farba pozadia */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Farba pozadia
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {avatarColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setAvatarBgColor(color)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        avatarBgColor === color ? 'border-white shadow-lg' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={avatarBgColor}
                  onChange={(e) => setAvatarBgColor(e.target.value)}
                  className="w-full h-10 rounded-lg border"
                />
              </div>

              {/* Náhľad */}
              <div className="text-center">
                <div 
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: avatarBgColor }}
                >
                  {initials || 'NA'}
                </div>
              </div>

              {/* Tlačidlá */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAvatarEditor(false)}
                  onTouchStart={() => {}}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Zrušiť
                </button>
                <button
                  onClick={handleSaveInitials}
                  onTouchStart={() => {}}
                  disabled={loading || !initials}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {loading ? 'Ukladám...' : 'Uložiť'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;