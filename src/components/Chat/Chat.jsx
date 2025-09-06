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
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { onlineCount } = useOnlineStatus();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Emoji list
  const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥', '👏', '😊', '😎', '🤗', '😘', '🥰', '😅', '🙏'];

  // Detekcia iOS (iPhone len)  
  const isIPhone = () => {
    const ua = navigator.userAgent;
    return /iPhone/.test(ua) && !window.MSStream;
  };

  // Auto-scroll na koniec správ
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll na koniec pri načítaní správ alebo pridaní novej správy
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Zatvorenie emoji pickera pri kliknutí mimo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Načítanie správ s fallback pre iPhone
  useEffect(() => {
    if (isIPhone()) {
      // Fallback: polling namiesto real-time listener pre iPhone
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

      // Okamžité načítanie
      pollMessages();
      
      // Pravidelné polling každé 3 sekundy
      const pollInterval = setInterval(pollMessages, 3000);
      
      return () => {
        clearInterval(pollInterval);
      };
    } else {
      // Štandardný real-time listener pre ostatné zariadenia
      const setupListener = () => {
        try {
          const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setMessages(messagesData);
            setError(null);
          }, (error) => {
            console.error('Firestore listener error:', error);
            setError('Chyba pripojenia k chatu');
          });
          
          return unsubscribe;
        } catch (error) {
          console.error('Setup listener error:', error);
          setError('Chyba pri nastavovaní chatu');
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

  // Handler pre výber súboru
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Kontrola veľkosti súboru (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Súbor je príliš veľký. Maximálna veľkosť je 10MB.');
        return;
      }

      setSelectedFile(file);
      
      // Vytvorenie preview pre obrázky
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setSelectedFilePreview(null);
      }
    }
  };

  // Odstránenie vybranej prílohy
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setSelectedFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Pridanie emotikonu do správy
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Upload súboru do Firebase Storage
  const uploadFile = async (file) => {
    const timestamp = Date.now();
    const fileName = `chat-attachments/${user.uid}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return {
        url: downloadURL,
        name: file.name,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Chyba pri nahrávaní súboru');
    }
  };

  // Odoslanie správy s prílohou
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !user || loading) return;

    setLoading(true);
    try {
      let attachmentData = null;

      // Upload prílohy ak existuje
      if (selectedFile) {
        setUploadProgress(50); // Simulácia progresu
        attachmentData = await uploadFile(selectedFile);
        setUploadProgress(100);
      }

      // Vytvorenie správy
      const messageData = {
        sender: user.name,
        senderUid: user.uid,
        content: newMessage.trim(),
        attachment: attachmentData,
        createdAt: serverTimestamp(),
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`
      };

      await addDoc(collection(db, 'messages'), messageData);
      
      // Vyčistenie polí
      setNewMessage('');
      removeSelectedFile();
      setUploadProgress(0);
      setError(null);
      setShowEmojiPicker(false); // Zatvoriť emoji picker
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Chyba pri odosielaní správy');
      
      // Retry mechanism for iOS
      if (isIPhone()) {
        setTimeout(async () => {
          try {
            let attachmentData = null;
            if (selectedFile) {
              attachmentData = await uploadFile(selectedFile);
            }
            
            await addDoc(collection(db, 'messages'), {
              sender: user.name,
              senderUid: user.uid,
              content: newMessage.trim(),
              attachment: attachmentData,
              createdAt: serverTimestamp(),
              avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`
            });
            
            setNewMessage('');
            removeSelectedFile();
            setError(null);
            setShowEmojiPicker(false);
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }, 1000);
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Formátovanie veľkosti súboru
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4`}>
        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Rodinný Chat
        </h3>
        <p className="text-sm text-gray-500">{onlineCount} členov online</p>
        {error && (
          <p className="text-sm text-red-500 mt-1">⚠️ {error}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => {
          const isMe = user && message.senderUid === user.uid;
          return (
            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                isMe ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {!isMe && (
                  <img 
                    src={message.avatar} 
                    alt={message.sender}
                    className="w-8 h-8 rounded-full mt-1"
                  />
                )}
                <div className={`px-4 py-2 rounded-lg ${
                  isMe 
                    ? 'bg-indigo-600 text-white' 
                    : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                }`}>
                  {!isMe && (
                    <p className="text-xs font-semibold mb-1">{message.sender}</p>
                  )}
                  
                  {/* Text správy */}
                  {message.content && <p>{message.content}</p>}
                  
                  {/* Príloha */}
                  {message.attachment && (
                    <div className="mt-2">
                      {message.attachment.type.startsWith('image/') ? (
                        <img 
                          src={message.attachment.url} 
                          alt={message.attachment.name}
                          className="max-w-full rounded cursor-pointer hover:opacity-90"
                          onClick={() => window.open(message.attachment.url, '_blank')}
                        />
                      ) : (
                        <a 
                          href={message.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center space-x-2 px-3 py-2 rounded ${
                            isMe ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-gray-600 hover:bg-gray-700'
                          } transition-colors`}
                        >
                          <i className="fas fa-paperclip"></i>
                          <span className="text-sm">{message.attachment.name}</span>
                          <span className="text-xs opacity-75">
                            ({formatFileSize(message.attachment.size)})
                          </span>
                        </a>
                      )}
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
        {/* Invisible div pre auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview */}
      {selectedFile && (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-t px-4 py-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedFilePreview ? (
                <img src={selectedFilePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
              ) : (
                <div className={`h-12 w-12 flex items-center justify-center rounded ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-300'
                }`}>
                  <i className="fas fa-file text-gray-500"></i>
                </div>
              )}
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="text-red-500 hover:text-red-600"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className={`h-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full overflow-hidden`}>
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4 relative`}>
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className={`emoji-picker-container absolute bottom-20 left-4 right-4 md:left-auto md:right-auto md:w-80 p-3 rounded-lg shadow-lg ${
            darkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="grid grid-cols-8 gap-2">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-600 rounded p-1 transition-colors"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            id="chat-file-input"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          />
          
          {/* Attachment button */}
          <label
            htmlFor="chat-file-input"
            className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            style={{ 
              WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
              touchAction: 'manipulation'
            }}
          >
            <i className="fas fa-paperclip"></i>
          </label>
          
          {/* Emoji button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`emoji-picker-container px-3 py-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            style={{ 
              WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
              touchAction: 'manipulation'
            }}
          >
            😊
          </button>
          
          {/* Message input */}
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
            placeholder="Napíšte správu..."
            className={`flex-1 px-4 py-2 rounded-lg ${
              darkMode 
                ? 'bg-gray-700 text-white placeholder-gray-400' 
                : 'bg-gray-100 text-gray-800'
            }`}
          />
          
          {/* Send button */}
          <button
            onClick={sendMessage}
            onTouchStart={() => {}}
            disabled={!user || (!newMessage.trim() && !selectedFile) || loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ 
              WebkitTapHighlightColor: 'rgba(79, 70, 229, 0.3)',
              touchAction: 'manipulation'
            }}
          >
            {loading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;