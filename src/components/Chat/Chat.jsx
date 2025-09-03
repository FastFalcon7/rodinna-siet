import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOnlineStatus } from '../../contexts/OnlineStatusContext';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { onlineCount } = useOnlineStatus();
  
  // Refs pre scroll management
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastScrollPosition = useRef(0);
  const fileInputRef = useRef(null);

  // Emoji lista - základné emotikony
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
    '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
    '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫',
    '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌',
    '🎉', '🎊', '🎈', '🎁', '🎂', '🍰', '🧁', '🍾', '🥂', '🍻'
  ];

  // Detekcia iOS (iPhone len)  
  const isIPhone = () => {
    const ua = navigator.userAgent;
    return /iPhone/.test(ua) && !window.MSStream;
  };

  // Scroll na koniec správ
  const scrollToBottom = () => {
    if (!userHasScrolled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  };

  // Sledovanie manuálneho scrollovania
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      if (scrollTop < lastScrollPosition.current - 10 && !isAtBottom) {
        setUserHasScrolled(true);
      }
      
      if (isAtBottom) {
        setUserHasScrolled(false);
      }
      
      lastScrollPosition.current = scrollTop;
    }
  };

  // Kompresia obrázka pomocou Canvas (rovnaká ako vo Feed.jsx)
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Vypočítať nové rozmery zachovávajúc pomer strán
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Nakresliť a komprimovať
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload súboru do Firebase Storage
  const uploadFile = async (file) => {
    try {
      const timestamp = Date.now();
      const fileName = `chat/${user.uid}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        type: file.type,
        name: file.name,
        size: file.size
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Spracovanie vybraných súborov
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadProgress(0);
    const newAttachments = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Kontrola veľkosti súboru (max 10MB pre originál)
      if (file.size > 10 * 1024 * 1024) {
        setError(`Súbor ${file.name} je príliš veľký (max 10MB)`);
        continue;
      }

      try {
        let processedFile = file;
        let preview = null;

        // Kompresia pre obrázky
        if (file.type.startsWith('image/')) {
          try {
            // Komprimovať obrázok
            const compressedBlob = await compressImage(file);
            processedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
            
            // Vytvoriť náhľad
            preview = URL.createObjectURL(compressedBlob);
            
            console.log(`Kompresia: ${file.size} → ${processedFile.size} bytes (${Math.round((1 - processedFile.size/file.size) * 100)}% úspora)`);
          } catch (error) {
            console.error('Chyba pri kompresii, použijem originál:', error);
            preview = URL.createObjectURL(file);
          }
        } else if (file.type.startsWith('video/')) {
          // Pre videá zatiaľ len náhľad
          preview = URL.createObjectURL(file);
        }

        newAttachments.push({
          file: processedFile,
          preview: preview,
          type: processedFile.type,
          name: file.name,
          originalSize: file.size,
          compressedSize: processedFile.size
        });

      } catch (err) {
        console.error('Error processing file:', err);
        setError(`Chyba pri spracovaní súboru ${file.name}`);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
      setShowAttachmentPreview(true);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Odstránenie prílohy
  const removeAttachment = (index) => {
    // Vyčistiť URL objekty
    if (attachments[index].preview) {
      URL.revokeObjectURL(attachments[index].preview);
    }
    
    setAttachments(prev => prev.filter((_, i) => i !== index));
    if (attachments.length <= 1) {
      setShowAttachmentPreview(false);
    }
  };

  // Pridanie emoji do správy
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Načítanie správ s fallback pre iPhone
  useEffect(() => {
    if (isIPhone()) {
      const pollMessages = async () => {
        try {
          const { getDocs } = await import('firebase/firestore');
          const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
          const snapshot = await getDocs(q);
          const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(messagesData);
          setError(null);
        } catch (error) {
          console.error('iPhone polling error:', error);
          setError('Chyba pri načítavaní (iPhone mode)');
        }
      };

      pollMessages();
      const pollInterval = setInterval(pollMessages, 3000);
      return () => clearInterval(pollInterval);
      
    } else {
      let retryCount = 0;
      const maxRetries = 3;
      
      const setupListener = () => {
        try {
          const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
          const unsubscribe = onSnapshot(q, 
            (snapshot) => {
              try {
                const messagesData = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));
                setMessages(messagesData);
                setError(null);
                retryCount = 0;
              } catch (err) {
                console.error('Error processing messages:', err);
                setError('Chyba pri načítavaní správ');
              }
            },
            (error) => {
              console.error('Firebase listener error:', error);
              setError('Problém s pripojením');
              
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(() => {
                  console.log(`Retrying Firebase connection (${retryCount}/${maxRetries})`);
                  setupListener();
                }, 2000 * retryCount);
              }
            }
          );
          
          return unsubscribe;
        } catch (err) {
          console.error('Error setting up Firebase listener:', err);
          setError('Chyba pri inicializácii chatu');
          return () => {};
        }
      };

      const unsubscribe = setupListener();
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [user]);

  // Scroll na koniec pri nových správach
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup URL objektov pri unmount
  useEffect(() => {
    return () => {
      attachments.forEach(attachment => {
        if (attachment.preview) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
    };
  }, [attachments]);

  // Odoslanie správy
  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !user || loading) return;

    setLoading(true);
    setUploadProgress(10);
    
    try {
      // Upload príloh do Firebase Storage
      const uploadedAttachments = [];
      
      for (let i = 0; i < attachments.length; i++) {
        setUploadProgress(10 + (i / attachments.length) * 80);
        
        try {
          const uploaded = await uploadFile(attachments[i].file);
          uploadedAttachments.push({
            ...uploaded,
            originalSize: attachments[i].originalSize,
            compressedSize: attachments[i].compressedSize
          });
        } catch (err) {
          console.error(`Chyba pri nahrávaní ${attachments[i].name}:`, err);
          setError(`Chyba pri nahrávaní ${attachments[i].name}`);
        }
      }

      setUploadProgress(90);

      // Vytvorenie správy
      await addDoc(collection(db, 'messages'), {
        sender: user.name,
        senderUid: user.uid,
        content: newMessage.trim(),
        attachments: uploadedAttachments,
        createdAt: serverTimestamp(),
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`
      });

      // Reset
      setNewMessage('');
      attachments.forEach(a => {
        if (a.preview) URL.revokeObjectURL(a.preview);
      });
      setAttachments([]);
      setShowAttachmentPreview(false);
      setError(null);
      setUserHasScrolled(false);
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Chyba pri odosielaní správy');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col w-full max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-3 sm:p-4`}>
        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Rodinný Chat
        </h3>
        <p className="text-sm text-gray-500">{onlineCount} členov online</p>
        {error && (
          <p className="text-sm text-red-500 mt-1">⚠️ {error}</p>
        )}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-2 space-y-2 overflow-y-auto"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          position: 'relative',
          scrollBehavior: userHasScrolled ? 'auto' : 'smooth'
        }}
      >
        {messages.map(message => {
          const isMe = user && message.senderUid === user.uid;
          return (
            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-[85%] sm:max-w-xs lg:max-w-md ${
                isMe ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {!isMe && (
                  <img 
                    src={message.avatar} 
                    alt={message.sender}
                    className="w-8 h-8 rounded-full mt-1 flex-shrink-0"
                  />
                )}
                <div className={`px-3 py-2 rounded-lg break-words ${
                  isMe 
                    ? 'bg-indigo-600 text-white' 
                    : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                }`}>
                  {!isMe && (
                    <p className="text-xs font-semibold mb-1">{message.sender}</p>
                  )}
                  
                  {/* Text správy */}
                  {message.content && <p className="break-words">{message.content}</p>}
                  
                  {/* Prílohy */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, idx) => {
                        // Obrázky
                        if (attachment.type?.startsWith('image/')) {
                          return (
                            <div key={idx}>
                              <img 
                                src={attachment.url} 
                                alt={attachment.name}
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => window.open(attachment.url, '_blank')}
                              />
                              {attachment.compressedSize && (
                                <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                                  {Math.round(attachment.compressedSize / 1024)}KB
                                  {attachment.originalSize && ` (pôvodne ${Math.round(attachment.originalSize / 1024)}KB)`}
                                </p>
                              )}
                            </div>
                          );
                        }
                        // Videá
                        if (attachment.type?.startsWith('video/')) {
                          return (
                            <video 
                              key={idx}
                              src={attachment.url} 
                              controls
                              className="max-w-full rounded-lg"
                              style={{ maxHeight: '300px' }}
                            />
                          );
                        }
                        // Ostatné súbory
                        return (
                          <a 
                            key={idx}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center space-x-2 p-2 rounded ${
                              isMe ? 'bg-indigo-500 hover:bg-indigo-400' : 
                              darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          >
                            <span role="img" aria-label="file">📄</span>
                            <span className="text-sm truncate max-w-[150px]">{attachment.name}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                  
                  <p className={`text-xs mt-1 ${
                    isMe ? 'text-indigo-200' : 'text-gray-500'
                  }`}>
                    {message.createdAt?.toDate?.()?.toLocaleTimeString?.('sk-SK', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) || ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview */}
      {showAttachmentPreview && attachments.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-2 sm:p-3`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {attachments.length} {attachments.length === 1 ? 'príloha' : 'prílohy'}
              {attachments.some(a => a.compressedSize) && (
                <span className="text-xs ml-2">
                  (komprimované)
                </span>
              )}
            </span>
            <button
              onClick={() => {
                attachments.forEach(a => {
                  if (a.preview) URL.revokeObjectURL(a.preview);
                });
                setAttachments([]);
                setShowAttachmentPreview(false);
              }}
              className="text-red-500 hover:text-red-600"
            >
              <span role="img" aria-label="close">❌</span>
            </button>
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative flex-shrink-0">
                {attachment.type?.startsWith('image/') ? (
                  <div>
                    <img 
                      src={attachment.preview} 
                      alt={attachment.name}
                      className="h-20 w-20 object-cover rounded"
                    />
                    {attachment.compressedSize && (
                      <span className="absolute bottom-0 right-0 text-xs bg-green-500 text-white px-1 rounded">
                        -{Math.round((1 - attachment.compressedSize/attachment.originalSize) * 100)}%
                      </span>
                    )}
                  </div>
                ) : attachment.type?.startsWith('video/') ? (
                  <div className={`h-20 w-20 rounded flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <span className="text-2xl" role="img" aria-label="video">🎬</span>
                  </div>
                ) : (
                  <div className={`h-20 w-20 rounded flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <span className="text-2xl" role="img" aria-label="file">📄</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-2 sm:p-3`}>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-2 max-h-60 overflow-y-auto">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => addEmoji(emoji)}
                className="text-xl sm:text-2xl hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-2 sm:p-4`}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />

        <div className="flex items-end space-x-1 sm:space-x-2">
          {/* Attachment Buttons */}
          <div className="flex space-x-1">
            {/* Emoji button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-1.5 sm:p-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="text-lg sm:text-xl" role="img" aria-label="emoji">😊</span>
            </button>

            {/* File upload - kombinované tlačidlo pre súbory aj fotky */}
            <label
              htmlFor="file-input"
              className={`p-1.5 sm:p-2 rounded-lg cursor-pointer ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="text-lg sm:text-xl" role="img" aria-label="attach">📎</span>
            </label>
          </div>

          {/* Message Input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={!user || loading}
            style={{
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            placeholder={loading ? "Nahrávam..." : "Napíšte správu..."}
            className={`flex-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base ${
              darkMode 
                ? 'bg-gray-700 text-white placeholder-gray-400' 
                : 'bg-gray-100 text-gray-800'
            } ${loading ? 'opacity-50' : ''}`}
          />

          {/* Send Button */}
          <button
            onClick={sendMessage}
            onTouchStart={() => {}}
            disabled={!user || (!newMessage.trim() && attachments.length === 0) || loading}
            className="px-3 py-1.5 sm:px-6 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              WebkitTapHighlightColor: 'rgba(79, 70, 229, 0.3)',
              touchAction: 'manipulation'
            }}
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <span role="img" aria-label="send">✈️</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;



// import React, { useState, useEffect } from 'react';
// import { useTheme } from '../../contexts/ThemeContext';
// import { useAuth } from '../../contexts/AuthContext';
// import { useOnlineStatus } from '../../contexts/OnlineStatusContext';
// import { db } from '../../firebase/config';
// import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';

// function Chat() {
//   const [currentView, setCurrentView] = useState('list'); // 'list' or 'chat'
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [chats, setChats] = useState([]);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [showNewChatMenu, setShowNewChatMenu] = useState(false);
//   const [showOptionsMenu, setShowOptionsMenu] = useState(false);
//   const [showEmojiMenu, setShowEmojiMenu] = useState(false);
//   const [showCameraMenu, setShowCameraMenu] = useState(false);
//   const { darkMode } = useTheme();
//   const { user } = useAuth();
//   const { onlineCount } = useOnlineStatus();

//   // Zatvorenie menu po kliku mimo
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       // Skontrolovať či klik nebol na tlačidlo menu alebo vnútri menu
//       const isMenuButton = event.target.closest('.menu-button');
//       const isInsideMenu = event.target.closest('.dropdown-menu');
      
//       if (!isMenuButton && !isInsideMenu) {
//         setShowNewChatMenu(false);
//         setShowOptionsMenu(false);
//         setShowEmojiMenu(false);
//         setShowCameraMenu(false);
//       }
//     };

//     document.addEventListener('click', handleClickOutside);
//     return () => document.removeEventListener('click', handleClickOutside);
//   }, [showNewChatMenu, showOptionsMenu, showEmojiMenu, showCameraMenu]);

//   // Detekcia iOS (iPhone len)  
//   const isIPhone = () => {
//     const ua = navigator.userAgent;
//     return /iPhone/.test(ua) && !window.MSStream;
//   };

//   // Načítanie chatov
//   useEffect(() => {
//     // Len hlavný rodinný chat
//     const mockChats = [
//       {
//         id: '1',
//         name: 'Rodinný Chat',
//         type: 'group',
//         lastMessage: 'Ahoj všetci! Ako sa máte?',
//         lastActivity: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
//         avatar: 'https://ui-avatars.com/api/?name=Rodinný+Chat&background=4F46E5&color=fff',
//         memberCount: onlineCount
//       }
//     ];
//     setChats(mockChats.sort((a, b) => b.lastActivity - a.lastActivity));
//   }, [onlineCount]);

//   // Načítanie správ pre vybraný chat
//   useEffect(() => {
//     if (!selectedChat || currentView !== 'chat') return;

//     if (isIPhone()) {
//       // Fallback: polling namiesto real-time listener pre iPhone
//       const pollMessages = async () => {
//         try {
//           const q = query(
//             collection(db, `chats/${selectedChat.id}/messages`), 
//             orderBy('createdAt', 'asc')
//           );
//           const snapshot = await getDocs(q);
//           const messagesData = snapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//           }));
//           setMessages(messagesData);
//           setError(null);
//         } catch (error) {
//           console.error('iPhone polling error:', error);
//           setError('Chyba pri načítavaní (iPhone mode)');
//         }
//       };

//       pollMessages();
//       const pollInterval = setInterval(pollMessages, 3000);
//       return () => clearInterval(pollInterval);
      
//     } else {
//       // Normálny real-time listener pre ostatné prehliadače  
//       let retryCount = 0;
//       const maxRetries = 3;
      
//       const setupListener = () => {
//         try {
//           const q = query(
//             collection(db, `chats/${selectedChat.id}/messages`), 
//             orderBy('createdAt', 'asc')
//           );
//           const unsubscribe = onSnapshot(q, 
//             (snapshot) => {
//               try {
//                 const messagesData = snapshot.docs.map(doc => ({
//                   id: doc.id,
//                   ...doc.data()
//                 }));
//                 setMessages(messagesData);
//                 setError(null);
//                 retryCount = 0;
//               } catch (err) {
//                 console.error('Error processing messages:', err);
//                 setError('Chyba pri načítavaní správ');
//               }
//             },
//             (error) => {
//               console.error('Firebase listener error:', error);
//               setError('Problém s pripojením');
              
//               if (retryCount < maxRetries) {
//                 retryCount++;
//                 setTimeout(() => {
//                   console.log(`Retrying Firebase connection (${retryCount}/${maxRetries})`);
//                   setupListener();
//                 }, 2000 * retryCount);
//               }
//             }
//           );
          
//           return unsubscribe;
//         } catch (err) {
//           console.error('Error setting up Firebase listener:', err);
//           setError('Chyba pri inicializácii chatu');
//           return () => {};
//         }
//       };

//       const unsubscribe = setupListener();
//       return () => {
//         if (typeof unsubscribe === 'function') {
//           unsubscribe();
//         }
//       };
//     }
//   }, [selectedChat, currentView, user]);


//   // Formátovanie dátumu poslednej aktivity
//   const formatLastActivity = (date) => {
//     const now = new Date();
//     const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
//     if (diffInDays === 0) {
//       // Dnes - ukáž čas
//       return date.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
//     } else if (diffInDays < 7) {
//       // Tento týždeň - ukáž deň
//       const days = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'];
//       return days[date.getDay()];
//     } else {
//       // Starší ako týždeň - ukáž dátum
//       return date.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: '2-digit' });
//     }
//   };

//   const sendMessage = async () => {
//     if (newMessage.trim() && user && !loading && selectedChat) {
//       setLoading(true);
//       try {
//         await addDoc(collection(db, `chats/${selectedChat.id}/messages`), {
//           sender: user.name,
//           senderUid: user.uid,
//           content: newMessage.trim(),
//           createdAt: serverTimestamp(),
//           avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`
//         });
//         setNewMessage('');
//         setError(null);
//       } catch (error) {
//         console.error('Error sending message:', error);
//         setError('Chyba pri odosielaní správy');
        
//         // Retry mechanism for iOS
//         setTimeout(async () => {
//           try {
//             await addDoc(collection(db, `chats/${selectedChat.id}/messages`), {
//               sender: user.name,
//               senderUid: user.uid,
//               content: newMessage.trim(),
//               createdAt: serverTimestamp(),
//               avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`
//             });
//             setNewMessage('');
//             setError(null);
//           } catch (retryError) {
//             console.error('Retry failed:', retryError);
//           }
//         }, 1000);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const openChat = (chat) => {
//     setSelectedChat(chat);
//     setCurrentView('chat');
//     setShowOptionsMenu(false);
//   };

//   // Pridanie emotikonov do správy
//   const addEmoji = (emoji) => {
//     setNewMessage(prev => prev + emoji);
//     setShowEmojiMenu(false);
//   };

//   // Otváranie kamery (file input s camera)
//   const openCamera = () => {
//     console.log('openCamera called');
//     setShowCameraMenu(false);
    
//     try {
//       const input = document.createElement('input');
//       input.type = 'file';
//       input.accept = 'image/*';
//       input.capture = 'environment'; // Použije back kameru na mobile
//       input.style.display = 'none';
      
//       input.onchange = (e) => {
//         console.log('Camera input changed:', e.target.files);
//         const file = e.target.files[0];
//         if (file) {
//           console.log('File selected from camera:', file.name, file.size);
//           handleImageUpload(file);
//         } else {
//           console.log('No file selected from camera');
//         }
//         // Vymazanie inputu
//         if (document.body.contains(input)) {
//           document.body.removeChild(input);
//         }
//       };
      
//       input.onerror = (error) => {
//         console.error('Camera input error:', error);
//         if (document.body.contains(input)) {
//           document.body.removeChild(input);
//         }
//       };
      
//       document.body.appendChild(input);
//       console.log('Clicking camera input...');
//       input.click();
      
//       // Fallback cleanup po 10 sekundách
//       setTimeout(() => {
//         if (document.body.contains(input)) {
//           document.body.removeChild(input);
//         }
//       }, 10000);
      
//     } catch (error) {
//       console.error('Error opening camera:', error);
//       setError('Chyba pri otváraní kamery');
//     }
//   };

//   // Otváranie galérie (file input bez camera)
//   const openGallery = () => {
//     console.log('openGallery called');
//     setShowCameraMenu(false);
    
//     try {
//       const input = document.createElement('input');
//       input.type = 'file';
//       input.accept = 'image/*';
//       input.multiple = false;
//       input.style.display = 'none';
      
//       input.onchange = (e) => {
//         console.log('Gallery input changed:', e.target.files);
//         const file = e.target.files[0];
//         if (file) {
//           console.log('File selected from gallery:', file.name, file.size);
//           handleImageUpload(file);
//         } else {
//           console.log('No file selected from gallery');
//         }
//         // Vymazanie inputu
//         if (document.body.contains(input)) {
//           document.body.removeChild(input);
//         }
//       };
      
//       input.onerror = (error) => {
//         console.error('Gallery input error:', error);
//         if (document.body.contains(input)) {
//           document.body.removeChild(input);
//         }
//       };
      
//       document.body.appendChild(input);
//       console.log('Clicking gallery input...');
//       input.click();
      
//       // Fallback cleanup po 10 sekundách
//       setTimeout(() => {
//         if (document.body.contains(input)) {
//           document.body.removeChild(input);
//         }
//       }, 10000);
      
//     } catch (error) {
//       console.error('Error opening gallery:', error);
//       setError('Chyba pri otváraní galérie');
//     }
//   };

//   // Upload a zobrazenie obrázka v chate
//   const handleImageUpload = async (file) => {
//     console.log('handleImageUpload called with file:', file);
    
//     if (!file) {
//       console.error('No file provided');
//       return;
//     }
    
//     if (!user || loading) {
//       console.error('User not available or loading');
//       return;
//     }
    
//     // Kontrola veľkosti súboru (max 5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       setError('Obrázok je príliš veľký (max 5MB)');
//       console.error('File too large:', file.size);
//       return;
//     }
    
//     console.log('Starting image upload process...');
//     setLoading(true);
    
//     try {
//       // Konverzia na base64 pre lokálne zobrazenie
//       const reader = new FileReader();
      
//       reader.onerror = (error) => {
//         console.error('FileReader error:', error);
//         setError('Chyba pri čítaní súboru');
//         setLoading(false);
//       };
      
//       reader.onload = async (e) => {
//         console.log('FileReader onload triggered');
//         const imageDataUrl = e.target.result;
        
//         if (!imageDataUrl) {
//           console.error('No image data URL generated');
//           setError('Chyba pri spracovaní obrázka');
//           setLoading(false);
//           return;
//         }
        
//         console.log('Image converted to base64, sending to Firestore...');
        
//         // Odoslanie ako správu s obrázkom
//         try {
//           const messageData = {
//             sender: user.name,
//             senderUid: user.uid,
//             content: '', // Prázdny text
//             imageUrl: imageDataUrl, // Base64 obrázok
//             imageFileName: file.name,
//             createdAt: serverTimestamp(),
//             avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`
//           };
          
//           console.log('Sending message with image:', messageData);
          
//           await addDoc(collection(db, selectedChat ? `chats/${selectedChat.id}/messages` : 'messages'), messageData);
          
//           console.log('Image message sent successfully!');
//           setError(null);
//         } catch (error) {
//           console.error('Error sending image:', error);
//           setError('Chyba pri odosílaní obrázka: ' + error.message);
//         } finally {
//           setLoading(false);
//         }
//       };
      
//       console.log('Starting FileReader...');
//       reader.readAsDataURL(file);
      
//     } catch (error) {
//       console.error('Error processing image:', error);
//       setError('Chyba pri spracovaní obrázka: ' + error.message);
//       setLoading(false);
//     }
//   };

//   // Zoznam často používaných emotikonov
//   const popularEmojis = ['😀', '😂', '❤️', '👍', '👏', '🔥', '💪', '🎉', '😍', '🤔', '😭', '🙄', '👌', '✨', '💯'];

//   const goBackToList = () => {
//     setCurrentView('list');
//     setSelectedChat(null);
//     setMessages([]);
//   };

//   // Automatické posúvanie na posledný príspevok
//   const messagesEndRef = React.useRef(null);
//   const messagesContainerRef = React.useRef(null);
//   const [isUserScrolling, setIsUserScrolling] = React.useState(false);
//   const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);
//   const lastTouchY = React.useRef(0);
//   const touchStartY = React.useRef(0);
//   const scrollTimeoutRef = React.useRef(null);
  
//   const scrollToBottom = () => {
//     if (shouldAutoScroll && !isUserScrolling) {
//       setTimeout(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//       }, 100);
//     }
//   };
  
//   // iPhone špecifické riešenie s touch eventmi
//   const handleTouchStart = (e) => {
//     if (!isIPhone()) return;
    
//     touchStartY.current = e.touches[0].clientY;
//     lastTouchY.current = e.touches[0].clientY;
    
//     // Clear any existing timeout
//     if (scrollTimeoutRef.current) {
//       clearTimeout(scrollTimeoutRef.current);
//       scrollTimeoutRef.current = null;
//     }
    
//     setIsUserScrolling(true);
//   };
  
//   const handleTouchMove = (e) => {
//     if (!isIPhone()) return;
    
//     const currentY = e.touches[0].clientY;
//     const deltaY = lastTouchY.current - currentY;
//     lastTouchY.current = currentY;
    
//     // Ak sa user dotýka a pohybuje, je to určite manuálne scrollovanie
//     if (Math.abs(deltaY) > 5) {
//       setIsUserScrolling(true);
//       setShouldAutoScroll(false);
//     }
//   };
  
//   const handleTouchEnd = (e) => {
//     if (!isIPhone()) return;
    
//     // Po skončení touch event, čakaj 2 sekundy pred resetom
//     scrollTimeoutRef.current = setTimeout(() => {
//       const container = messagesContainerRef.current;
//       if (container) {
//         const { scrollTop, scrollHeight, clientHeight } = container;
//         const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
        
//         if (isAtBottom) {
//           setShouldAutoScroll(true);
//           setIsUserScrolling(false);
//         }
//       }
//     }, 2000);
//   };
  
//   // Detekcia manuálneho scrollovania pre non-iPhone
//   const handleScroll = (e) => {
//     if (isIPhone()) return; // iPhone používa touch eventy
    
//     const container = e.target;
//     const { scrollTop, scrollHeight, clientHeight } = container;
//     const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    
//     if (isAtBottom) {
//       setShouldAutoScroll(true);
//       setIsUserScrolling(false);
//     } else {
//       setShouldAutoScroll(false);
//       setIsUserScrolling(true);
//     }
//   };
  
//   // Reset scrolling state po nečinnosti (len pre non-iPhone)
//   useEffect(() => {
//     if (!isIPhone() && isUserScrolling) {
//       const timer = setTimeout(() => {
//         setIsUserScrolling(false);
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [isUserScrolling]);
  
//   // Auto-scroll len keď sa messages zmenia a je to povolené
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);
  
//   // Cleanup timeout pri unmount
//   useEffect(() => {
//     return () => {
//       if (scrollTimeoutRef.current) {
//         clearTimeout(scrollTimeoutRef.current);
//       }
//     };
//   }, []);

//   if (currentView === 'list') {
//     return (
//       <div className="h-full flex flex-col max-w-4xl mx-auto">
//         {/* Chat List Header */}
//         <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4`}>
//           <div className="flex items-center justify-between">
//             <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
//               Chaty
//             </h3>
//             <div className="flex items-center space-x-3">
//               {/* Menu options (tri bodky) */}
//               <div className="relative">
//                 <button
//                   onClick={(e) => {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     setShowOptionsMenu(!showOptionsMenu);
//                   }}
//                   onTouchStart={(e) => {
//                     e.preventDefault();
//                   }}
//                   onTouchEnd={(e) => {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     setShowOptionsMenu(!showOptionsMenu);
//                   }}
//                   className={`menu-button p-2 rounded-full cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
//                   style={{ 
//                     WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
//                     touchAction: 'manipulation',
//                     WebkitUserSelect: 'none',
//                     userSelect: 'none'
//                   }}
//                 >
//                   <i className={`fas fa-ellipsis-v ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
//                 </button>
//                 {showOptionsMenu && (
//                   <div className={`dropdown-menu absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'} z-10`}>
//                     <button 
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setShowOptionsMenu(false);
//                         // Tu bude logika pre úpravu
//                       }}
//                       className={`w-full text-left px-4 py-2 hover:${darkMode ? 'bg-gray-600' : 'bg-gray-50'} ${darkMode ? 'text-white' : 'text-gray-800'} rounded-t-lg`}
//                     >
//                       <i className="fas fa-edit mr-2"></i>Upraviť chat
//                     </button>
//                     <button 
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setShowOptionsMenu(false);
//                         // Tu bude logika pre mazanie
//                       }}
//                       className={`w-full text-left px-4 py-2 hover:${darkMode ? 'bg-gray-600' : 'bg-gray-50'} text-red-500 rounded-b-lg`}
//                     >
//                       <i className="fas fa-trash mr-2"></i>Vymazať chat
//                     </button>
//                   </div>
//                 )}
//               </div>
//               {/* Add new chat button */}
//               <div className="relative">
//                 <button
//                   onClick={(e) => {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     setShowNewChatMenu(!showNewChatMenu);
//                   }}
//                   onTouchStart={(e) => {
//                     e.preventDefault();
//                   }}
//                   onTouchEnd={(e) => {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     setShowNewChatMenu(!showNewChatMenu);
//                   }}
//                   className="menu-button p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 cursor-pointer"
//                   style={{ 
//                     WebkitTapHighlightColor: 'rgba(79, 70, 229, 0.3)',
//                     touchAction: 'manipulation',
//                     WebkitUserSelect: 'none',
//                     userSelect: 'none'
//                   }}
//                 >
//                   <i className="fas fa-plus"></i>
//                 </button>
//                 {showNewChatMenu && (
//                   <div className={`dropdown-menu absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'} z-10`}>
//                     <button 
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setShowNewChatMenu(false);
//                         // Tu bude logika pre jeden kontakt
//                       }}
//                       className={`w-full text-left px-4 py-2 hover:${darkMode ? 'bg-gray-600' : 'bg-gray-50'} ${darkMode ? 'text-white' : 'text-gray-800'} rounded-t-lg`}
//                     >
//                       <i className="fas fa-user mr-2"></i>Jeden kontakt
//                     </button>
//                     <button 
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setShowNewChatMenu(false);
//                         // Tu bude logika pre skupinu
//                       }}
//                       className={`w-full text-left px-4 py-2 hover:${darkMode ? 'bg-gray-600' : 'bg-gray-50'} ${darkMode ? 'text-white' : 'text-gray-800'} rounded-b-lg`}
//                     >
//                       <i className="fas fa-users mr-2"></i>Vytvoriť skupinu
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//           {error && (
//             <p className="text-sm text-red-500 mt-2">⚠️ {error}</p>
//           )}
//         </div>

//         {/* Chat List */}
//         <div className="flex-1 overflow-y-auto">
//           {chats.map(chat => (
//             <div
//               key={chat.id}
//               onClick={() => openChat(chat)}
//               onTouchStart={() => {}}
//               className={`flex items-center p-4 border-b ${darkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'} cursor-pointer`}
//               style={{ 
//                 WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.1)',
//                 touchAction: 'manipulation'
//               }}
//             >
//               <img 
//                 src={chat.avatar} 
//                 alt={chat.name}
//                 className="w-12 h-12 rounded-full mr-3 flex-shrink-0"
//               />
//               <div className="flex-1 min-w-0">
//                 <div className="flex justify-between items-center mb-1">
//                   <h4 className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                     {chat.name}
//                     {chat.type === 'group' && (
//                       <i className="fas fa-users ml-1 text-xs text-gray-400"></i>
//                     )}
//                   </h4>
//                   <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0 ml-2`}>
//                     {formatLastActivity(chat.lastActivity)}
//                   </span>
//                 </div>
//                 <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
//                   {chat.lastMessage}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   // Chat View (konkrétny chat)
//   return (
//     <div className="h-full flex flex-col max-w-4xl mx-auto">
//       {/* Chat Header */}
//       <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4`}>
//         <div className="flex items-center">
//           <button
//             onClick={goBackToList}
//             onTouchStart={() => {}}
//             className={`mr-3 p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
//             style={{ 
//               WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
//               touchAction: 'manipulation'
//             }}
//           >
//             <i className={`fas fa-arrow-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
//           </button>
//           <img 
//             src={selectedChat?.avatar} 
//             alt={selectedChat?.name}
//             className="w-8 h-8 rounded-full mr-3"
//           />
//           <div>
//             <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
//               {selectedChat?.name}
//             </h3>
//             {selectedChat?.type === 'group' && selectedChat?.memberCount && (
//               <p className="text-sm text-gray-500">{selectedChat.memberCount} členov online</p>
//             )}
//           </div>
//         </div>
//         {error && (
//           <p className="text-sm text-red-500 mt-1">⚠️ {error}</p>
//         )}
//       </div>

//       {/* Messages */}
//       <div 
//         ref={messagesContainerRef}
//         onScroll={handleScroll}
//         onTouchStart={handleTouchStart}
//         onTouchMove={handleTouchMove}
//         onTouchEnd={handleTouchEnd}
//         className="flex-1 overflow-y-auto p-4 space-y-4"
//         style={{
//           WebkitOverflowScrolling: 'touch',
//           overscrollBehavior: 'contain',
//           touchAction: 'pan-y'
//         }}
//       >
//         {messages.map(message => {
//           const isMe = user && message.senderUid === user.uid;
//           return (
//             <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
//               <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
//                 isMe ? 'flex-row-reverse space-x-reverse' : ''
//               }`}>
//                 {!isMe && (
//                   <img 
//                     src={message.avatar} 
//                     alt={message.sender}
//                     className="w-8 h-8 rounded-full mt-1"
//                   />
//                 )}
//                 <div className={`px-4 py-2 rounded-lg ${
//                   isMe 
//                     ? 'bg-indigo-600 text-white' 
//                     : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
//                 }`}>
//                   {!isMe && (
//                     <p className="text-xs font-semibold mb-1">{message.sender}</p>
//                   )}
//                   {message.imageUrl ? (
//                     <div>
//                       <img 
//                         src={message.imageUrl} 
//                         alt={message.imageFileName || 'Obrázok'}
//                         className="max-w-full h-auto rounded-lg mb-2 cursor-pointer"
//                         style={{ maxHeight: '200px' }}
//                         onClick={() => {
//                           // Otvoriť obrázok v novom okne
//                           window.open(message.imageUrl, '_blank');
//                         }}
//                       />
//                       {message.content && <p className="mt-2">{message.content}</p>}
//                     </div>
//                   ) : (
//                     <p>{message.content}</p>
//                   )}
//                   <p className={`text-xs mt-1 ${
//                     isMe ? 'text-indigo-200' : 'text-gray-500'
//                   }`}>
//                     {message.createdAt?.toDate?.()?.toLocaleTimeString?.('sk-SK', { 
//                       hour: '2-digit', 
//                       minute: '2-digit' 
//                     }) || ''}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4`}>
//         <div className="flex items-center space-x-2">
//           {/* Emoticons button */}
//           {/* Emoticons button */}
//           <div className="relative">
//             <div
//               onClick={(e) => {
//                 console.log('Emoji button clicked');
//                 e.preventDefault();
//                 e.stopPropagation();
//                 setShowEmojiMenu(!showEmojiMenu);
//               }}
//               onTouchStart={(e) => {
//                 console.log('Emoji button touch start');
//                 e.preventDefault();
//               }}
//               onTouchEnd={(e) => {
//                 console.log('Emoji button touch end');
//                 e.preventDefault();
//                 e.stopPropagation();
//                 setShowEmojiMenu(!showEmojiMenu);
//               }}
//               className={`menu-button p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} cursor-pointer select-none`}
//               style={{ 
//                 WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
//                 touchAction: 'manipulation',
//                 WebkitUserSelect: 'none',
//                 userSelect: 'none'
//               }}
//             >
//               <i className="fas fa-smile"></i>
//             </div>
//             {showEmojiMenu && (
//               <div className={`dropdown-menu absolute bottom-12 left-0 w-64 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'} z-20 p-3`}>
//                 <div className="grid grid-cols-5 gap-2">
//                   {popularEmojis.map((emoji, index) => (
//                     <button
//                       key={index}
//                       onClick={() => addEmoji(emoji)}
//                       className={`p-2 text-xl hover:${darkMode ? 'bg-gray-600' : 'bg-gray-100'} rounded transition-colors`}
//                       style={{ 
//                         WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
//                         touchAction: 'manipulation'
//                       }}
//                     >
//                       {emoji}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//           {/* Camera/photo button */}
//           <div className="relative">
//             <div
//               onClick={(e) => {
//                 console.log('Camera button clicked');
//                 e.preventDefault();
//                 e.stopPropagation();
//                 setShowCameraMenu(!showCameraMenu);
//               }}
//               onTouchStart={(e) => {
//                 console.log('Camera button touch start');
//                 e.preventDefault();
//               }}
//               onTouchEnd={(e) => {
//                 console.log('Camera button touch end');
//                 e.preventDefault();
//                 e.stopPropagation();
//                 setShowCameraMenu(!showCameraMenu);
//               }}
//               className={`menu-button p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} cursor-pointer select-none`}
//               style={{ 
//                 WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
//                 touchAction: 'manipulation',
//                 WebkitUserSelect: 'none',
//                 userSelect: 'none'
//               }}
//             >
//               <i className="fas fa-camera"></i>
//             </div>
//             {showCameraMenu && (
//               <div className={`dropdown-menu absolute bottom-12 left-0 w-48 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'} z-20`}>
//                 <button 
//                   onClick={openCamera}
//                   className={`w-full text-left px-4 py-3 hover:${darkMode ? 'bg-gray-600' : 'bg-gray-50'} ${darkMode ? 'text-white' : 'text-gray-800'} rounded-t-lg flex items-center`}
//                   style={{ 
//                     WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
//                     touchAction: 'manipulation'
//                   }}
//                 >
//                   <i className="fas fa-camera mr-3"></i>Otvoriť kameru
//                 </button>
//                 <button 
//                   onClick={openGallery}
//                   className={`w-full text-left px-4 py-3 hover:${darkMode ? 'bg-gray-600' : 'bg-gray-50'} ${darkMode ? 'text-white' : 'text-gray-800'} rounded-b-lg flex items-center`}
//                   style={{ 
//                     WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
//                     touchAction: 'manipulation'
//                   }}
//                 >
//                   <i className="fas fa-images mr-3"></i>Vybrať z galérie
//                 </button>
//               </div>
//             )}
//           </div>
//           <input
//             type="text"
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter' && !e.shiftKey) {
//                 e.preventDefault();
//                 sendMessage();
//               }
//             }}
//             disabled={!user}
//             style={{
//               WebkitAppearance: 'none',
//               WebkitTapHighlightColor: 'transparent'
//             }}
//             placeholder="Napíšte správu..."
//             className={`flex-1 px-4 py-2 rounded-lg ${
//               darkMode 
//                 ? 'bg-gray-700 text-white placeholder-gray-400' 
//                 : 'bg-gray-100 text-gray-800'
//             }`}
//           />
//           <button
//             onClick={sendMessage}
//             onTouchStart={() => {}}
//             disabled={!user || !newMessage.trim() || loading}
//             className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
//             style={{ 
//               WebkitTapHighlightColor: 'rgba(79, 70, 229, 0.3)',
//               touchAction: 'manipulation'
//             }}
//           >
//             {loading ? (
//               <i className="fas fa-spinner fa-spin"></i>
//             ) : (
//               <i className="fas fa-paper-plane"></i>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Chat;