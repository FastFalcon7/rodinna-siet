import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

function FamilyMembers() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [customStatusText, setCustomStatusText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  // Quick status presets
  const quickStatusPresets = [
    { emoji: '🏠', text: 'Doma' },
    { emoji: '🏢', text: 'V práci' },
    { emoji: '🏫', text: 'V škole' },
    { emoji: '🚗', text: 'Cestujem' },
    { emoji: '😴', text: 'Spím' },
    { emoji: '🏖️', text: 'Na dovolenke' },
    { emoji: '🏥', text: 'U lekára' },
    { emoji: '🍽️', text: 'Večeriam' },
    { emoji: '🎮', text: 'Hrám sa' },
    { emoji: '📚', text: 'Učím sa' },
    { emoji: '🎵', text: 'Počúvam hudbu' },
    { emoji: '🏃', text: 'Cvičím' }
  ];

  const emojiOptions = ['😊', '😎', '🤗', '😴', '🤔', '😋', '🥳', '🤒', '😇', '🤓', '🏠', '🏢', '🏫', '🚗', '✈️', '🏖️', '🏥', '🍽️', '☕', '🎮', '📚', '🎵', '🏃', '💪', '🎨', '🎬'];

  // Load family members with real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        // Určenie online statusu podľa lastSeen
        isOnline: isUserOnline(doc.data().lastSeen)
      }));
      setMembers(membersData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading members:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update user's last seen timestamp periodically
  useEffect(() => {
    if (!user) return;

    const updateLastSeen = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating last seen:', error);
      }
    };

    // Update immediately
    updateLastSeen();

    // Update every 2 minutes
    const interval = setInterval(updateLastSeen, 120000);

    return () => clearInterval(interval);
  }, [user]);

  // Close modal on outside click
  useEffect(() => {
    const handleModalClick = (event) => {
      if (modalRef.current && event.target === modalRef.current) {
        closeModal();
      }
    };

    if (showStatusModal) {
      document.addEventListener('mousedown', handleModalClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleModalClick);
    };
  }, [showStatusModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showStatusModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showStatusModal]);

  const isUserOnline = (lastSeen) => {
    if (!lastSeen) return false;

    // Konverzia Firestore Timestamp na Date
    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now - lastSeenDate) / 1000 / 60;

    // Online ak bol aktívny v posledných 5 minútach
    return diffMinutes < 5;
  };

  const getLastSeenText = (lastSeen) => {
    if (!lastSeen) return 'Dávno';

    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSeenDate) / 1000 / 60);

    if (diffMinutes < 1) return 'Práve teraz';
    if (diffMinutes < 60) return `Pred ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Pred ${diffHours} h`;

    const diffDays = Math.floor(diffHours / 24);
    return `Pred ${diffDays} dňami`;
  };

  const openModal = () => {
    // Načítať aktuálny status užívateľa
    const currentMember = members.find(m => m.uid === user.uid);
    if (currentMember?.status) {
      setSelectedEmoji(currentMember.status.emoji || '😊');
      setCustomStatusText(currentMember.status.text || '');
    }
    setShowStatusModal(true);
  };

  const closeModal = () => {
    setShowStatusModal(false);
    setCustomStatusText('');
    setSelectedEmoji('😊');
  };

  const handleQuickStatus = async (preset) => {
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        status: {
          emoji: preset.emoji,
          text: preset.text,
          updatedAt: serverTimestamp()
        }
      });
      closeModal();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Chyba pri aktualizácii statusu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomStatus = async () => {
    if (!customStatusText.trim()) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        status: {
          emoji: selectedEmoji,
          text: customStatusText.trim(),
          updatedAt: serverTimestamp()
        }
      });
      closeModal();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Chyba pri aktualizácii statusu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearStatus = async () => {
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        status: null
      });
      closeModal();
    } catch (error) {
      console.error('Error clearing status:', error);
      alert('Chyba pri vymazaní statusu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-8 text-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Načítavam členov rodiny...
          </p>
        </div>
      </div>
    );
  }

  // Rozdelenie na online a offline členov
  const onlineMembers = members.filter(m => m.isOnline);
  const offlineMembers = members.filter(m => !m.isOnline);

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      {/* Current user status card */}
      <div className={`${darkMode ? 'bg-gradient-to-r from-indigo-800 to-purple-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} rounded-xl shadow-lg p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full border-4 border-white"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{user.name}</h2>
              {members.find(m => m.uid === user.uid)?.status ? (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl">{members.find(m => m.uid === user.uid).status.emoji}</span>
                  <span className="text-sm">{members.find(m => m.uid === user.uid).status.text}</span>
                </div>
              ) : (
                <p className="text-sm opacity-90">Nastavte si status</p>
              )}
            </div>
          </div>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 font-medium"
            style={{
              WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.3)',
              touchAction: 'manipulation'
            }}
          >
            <i className="fas fa-edit mr-2"></i>
            Zmeniť status
          </button>
        </div>
      </div>

      {/* Online members */}
      {onlineMembers.length > 0 && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Online ({onlineMembers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {onlineMembers.map(member => (
              <div
                key={member.uid}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-4`}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-14 h-14 rounded-full"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {member.name}
                    </h3>
                    {member.status ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg">{member.status.emoji}</span>
                        <span className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {member.status.text}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-green-500">Online</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline members */}
      {offlineMembers.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Offline ({offlineMembers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {offlineMembers.map(member => (
              <div
                key={member.uid}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-4 opacity-75`}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-14 h-14 rounded-full grayscale"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {member.name}
                    </h3>
                    {member.status ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg opacity-60">{member.status.emoji}</span>
                        <span className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {member.status.text}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {getLastSeenText(member.lastSeen)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} w-full md:max-w-lg md:rounded-xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col`}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Nastaviť status
              </h2>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`fas fa-times ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Quick status presets */}
              <div>
                <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rýchly status
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickStatusPresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickStatus(preset)}
                      disabled={isSubmitting}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation'
                      }}
                    >
                      <span className="text-2xl">{preset.emoji}</span>
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {preset.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom status */}
              <div>
                <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Vlastný status
                </h3>

                {/* Emoji picker */}
                <div className="mb-3">
                  <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Vyberte emoji
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`text-2xl p-2 rounded-lg transition-all ${
                          selectedEmoji === emoji
                            ? 'bg-indigo-100 dark:bg-indigo-900 scale-110'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status text input */}
                <div>
                  <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Text statusu
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-3xl">{selectedEmoji}</span>
                    <input
                      type="text"
                      value={customStatusText}
                      onChange={(e) => setCustomStatusText(e.target.value)}
                      placeholder="Napr. Na stretnutí"
                      maxLength={50}
                      className={`flex-1 p-3 rounded-lg ${
                        darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800'
                      }`}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCustomStatus}
                  disabled={!customStatusText.trim() || isSubmitting}
                  className="w-full mt-3 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  style={{
                    WebkitTapHighlightColor: 'rgba(79, 70, 229, 0.3)',
                    touchAction: 'manipulation'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Nastavujem...
                    </>
                  ) : (
                    'Nastaviť status'
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            {members.find(m => m.uid === user.uid)?.status && (
              <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={handleClearStatus}
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Vymazať status
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default FamilyMembers;
