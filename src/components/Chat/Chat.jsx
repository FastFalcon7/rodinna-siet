import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOnlineStatus } from '../../contexts/OnlineStatusContext';
import { useGroups } from '../../contexts/GroupContext';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AttachmentButton from '../Shared/AttachmentButton';
import MediaViewer from '../Shared/MediaViewer';
import VideoPlayer from '../Shared/VideoPlayer';
import GroupList from './GroupChat/GroupList';
import GroupCreator from './GroupChat/GroupCreator';
import VoiceRecorder, { VoiceMessage } from './VoiceRecorder';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showMediaViewer, setShowMediaViewer] = useState(null);
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [showGroupList, setShowGroupList] = useState(true);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { onlineCount } = useOnlineStatus();
  const { activeGroup } = useGroups();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Emoji list
  const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥', '👏', '😊', '😎', '🤗', '😘', '🥰', '😅', '🙏'];

  // Detekcia iOS (iPhone len)
  const isIPhone = () => {
    const ua = navigator.userAgent;
    return /iPhone/.test(ua) && !window.MSStream;
  };

  // Auto-scroll na koniec správ
  const scrollToBottom = () => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      if (isIPhone()) {
        setTimeout(() => {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        }, 100);
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Detekcia pozície skrolovania
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom < 100;
      setIsNearBottom(nearBottom);
      setUserHasScrolled(distanceFromBottom > 100);
    }
  };

  useEffect(() => {
    if (!userHasScrolled || isNearBottom) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    setTimeout(() => scrollToBottom(), 200);
  }, []);

  // Zatvorenie emoji pickera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Načítanie správ (s podporou skupín)
  useEffect(() => {
    if (!user) return;

    const messagesCollection = activeGroup
      ? collection(db, 'groups', activeGroup.id, 'messages')
      : collection(db, 'messages');

    if (isIPhone()) {
      // Fallback: polling pre iPhone
      const pollMessages = async () => {
        try {
          const { getDocs } = await import('firebase/firestore');
          const q = query(messagesCollection, orderBy('createdAt', 'asc'));
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
      // Štandardný real-time listener
      try {
        const q = query(messagesCollection, orderBy('createdAt', 'asc'));
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
      }
    }
  }, [user, activeGroup]);

  // Handler pre výber súboru
  const handleFileSelect = (file) => {
    setSelectedFile(file);

    // Vytvorenie preview
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFilePreview(null);
    }
  };

  // Odstránenie vybranej prílohy
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setSelectedFilePreview(null);
  };

  // Pridanie emotikonu
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Upload súboru
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

  // Odoslanie správy
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !user || loading) return;

    setLoading(true);
    setUserHasScrolled(false);

    try {
      let attachmentData = null;

      if (selectedFile) {
        setUploadProgress(50);
        attachmentData = await uploadFile(selectedFile);
        setUploadProgress(100);
      }

      const messagesCollection = activeGroup
        ? collection(db, 'groups', activeGroup.id, 'messages')
        : collection(db, 'messages');

      const messageData = {
        sender: user.name,
        senderUid: user.uid,
        content: newMessage.trim(),
        attachment: attachmentData,
        createdAt: serverTimestamp(),
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`
      };

      await addDoc(messagesCollection, messageData);

      setNewMessage('');
      removeSelectedFile();
      setUploadProgress(0);
      setError(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Chyba pri odosielaní správy');
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

  // Upload voice message
  const uploadVoiceMessage = async (audioBlob) => {
    const timestamp = Date.now();
    const fileName = `voice-messages/${user.uid}/${timestamp}.webm`;
    const storageRef = ref(storage, fileName);

    try {
      await uploadBytes(storageRef, audioBlob);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Error uploading voice message:', error);
      throw new Error('Chyba pri nahrávaní hlasovej správy');
    }
  };

  // Handle voice recording complete
  const handleVoiceRecording = async ({ blob, duration }) => {
    setLoading(true);
    try {
      const voiceUrl = await uploadVoiceMessage(blob);

      const messagesCollection = activeGroup
        ? collection(db, 'groups', activeGroup.id, 'messages')
        : collection(db, 'messages');

      await addDoc(messagesCollection, {
        sender: user.name,
        senderUid: user.uid,
        content: '',
        voiceMessage: {
          url: voiceUrl,
          duration: duration
        },
        createdAt: serverTimestamp(),
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`
      });

      setShowVoiceRecorder(false);
      setError(null);
    } catch (error) {
      console.error('Error sending voice message:', error);
      setError('Chyba pri odosielaní hlasovej správy');
    } finally {
      setLoading(false);
    }
  };

  // Render attachment v správe (NOVÝ - maximálna šírka)
  const renderAttachment = (attachment, isMe) => {
    if (!attachment) return null;

    const isImage = attachment.type?.startsWith('image/');
    const isVideo = attachment.type?.startsWith('video/');

    if (isImage) {
      return (
        <img
          src={attachment.url}
          alt={attachment.name}
          className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxWidth: '85%', maxHeight: '400px', width: 'auto', height: 'auto' }}
          onClick={() => setShowMediaViewer(attachment)}
        />
      );
    }

    if (isVideo) {
      return (
        <VideoPlayer
          src={attachment.url}
          thumbnail={attachment.thumbnail}
          name={attachment.name}
          onFullscreen={() => setShowMediaViewer(attachment)}
        />
      );
    }

    // Ostatné súbory
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center space-x-2 px-3 py-2 rounded ${
          isMe ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-gray-600 hover:bg-gray-700'
        } transition-colors`}
      >
        <i className="fas fa-paperclip"></i>
        <span className="text-sm">{attachment.name}</span>
        <span className="text-xs opacity-75">
          ({formatFileSize(attachment.size)})
        </span>
      </a>
    );
  };

  return (
    <div className="h-full flex w-full mx-auto" style={{ maxWidth: '100vw' }}>
      {/* Group List Sidebar (desktop) */}
      {showGroupList && (
        <div className="hidden md:block w-64 lg:w-80">
          <GroupList
            onSelectGroup={() => {}}
            onCreateGroup={() => setShowGroupCreator(true)}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {activeGroup ? activeGroup.name : 'Rodinný Chat'}
              </h3>
              <p className="text-sm text-gray-500">
                {activeGroup
                  ? `${activeGroup.members?.length || 0} členov`
                  : `${onlineCount} členov online`
                }
              </p>
            </div>

            {/* Toggle group list button (mobile) */}
            <button
              onClick={() => setShowGroupList(!showGroupList)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 mt-1">⚠️ {error}</p>
          )}
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {messages.map(message => {
            const isMe = user && message.senderUid === user.uid;
            return (
              <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`flex items-start space-x-2 max-w-[90%] ${
                  isMe ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {!isMe && (
                    <img
                      src={message.avatar}
                      alt={message.sender}
                      className="w-8 h-8 rounded-full mt-1 flex-shrink-0"
                    />
                  )}
                  <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
                      : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                  } break-words`}>
                    {!isMe && (
                      <p className="text-xs font-semibold mb-1 opacity-75">{message.sender}</p>
                    )}

                    {/* Text správy */}
                    {message.content && <p className="break-words">{message.content}</p>}

                    {/* Voice message */}
                    {message.voiceMessage && (
                      <div className="mt-2">
                        <VoiceMessage
                          url={message.voiceMessage.url}
                          duration={message.voiceMessage.duration}
                          sender={message.sender}
                          isMe={isMe}
                        />
                      </div>
                    )}

                    {/* Príloha - NOVÉ: maximálna šírka */}
                    {message.attachment && (
                      <div className="mt-2">
                        {renderAttachment(message.attachment, isMe)}
                      </div>
                    )}

                    <p className={`text-xs mt-1 opacity-60`}>
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
          <div ref={messagesEndRef} style={{ height: '1px' }} />
        </div>

        {/* Attachment Preview */}
        {selectedFile && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-t px-4 py-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedFilePreview ? (
                  selectedFile.type.startsWith('video/') ? (
                    <video src={selectedFilePreview} className="h-12 w-12 object-cover rounded" />
                  ) : (
                    <img src={selectedFilePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                  )
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

        {/* Voice Recorder */}
        {showVoiceRecorder && (
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecording}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        )}

        {/* Input */}
        {!showVoiceRecorder && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-3 sm:p-4 relative`}>
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className={`emoji-picker-container absolute bottom-20 left-4 right-4 md:left-auto md:right-auto md:w-80 p-3 rounded-lg shadow-lg z-10 ${
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

            <div className="flex space-x-1 sm:space-x-2">
              {/* Voice button */}
              <button
                onClick={() => setShowVoiceRecorder(true)}
                className={`px-2 sm:px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                style={{
                  WebkitTapHighlightColor: 'rgba(107, 114, 128, 0.3)',
                  touchAction: 'manipulation'
                }}
                title="Nahrať hlasovú správu"
              >
                <i className="fas fa-microphone"></i>
              </button>

              {/* NOVÝ: Unified Attachment Button */}
              <AttachmentButton
                onFileSelect={handleFileSelect}
                variant="menu"
              />

              {/* Emoji button */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`emoji-picker-container px-2 sm:px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${
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
                disabled={!user || loading}
                style={{
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent'
                }}
                placeholder="Napíšte správu..."
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400'
                    : 'bg-gray-100 text-gray-800'
                } min-w-0`}
              />

              {/* Send button */}
              <button
                onClick={sendMessage}
                onTouchStart={() => {}}
                disabled={!user || (!newMessage.trim() && !selectedFile) || loading}
                className="px-3 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
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
        )}
      </div>

      {/* Media Viewer */}
      {showMediaViewer && (
        <MediaViewer
          media={showMediaViewer}
          onClose={() => setShowMediaViewer(null)}
        />
      )}

      {/* Group Creator Modal */}
      {showGroupCreator && (
        <GroupCreator onClose={() => setShowGroupCreator(false)} />
      )}
    </div>
  );
}

export default Chat;
