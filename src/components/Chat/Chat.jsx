import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOnlineStatus } from '../../contexts/OnlineStatusContext';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [replyTo, setReplyTo] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showMediaPreview, setShowMediaPreview] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [userJustSentMessage, setUserJustSentMessage] = useState(false);

  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { onlineCount } = useOnlineStatus();
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const attachmentMenuRef = useRef(null);

  // Detekcia iOS (iPhone len)
  const isIPhone = () => {
    const ua = navigator.userAgent;
    return /iPhone/.test(ua) && !window.MSStream;
  };

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

      // Polling každých 3 sekundy
      const pollInterval = setInterval(pollMessages, 3000);
      return () => clearInterval(pollInterval);

    } else {
      // Normálny real-time listener pre ostatné prehliadače
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

  // Check if user is at bottom of messages
  const checkIfUserAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 150; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Handle scroll event
  const handleScroll = () => {
    setIsUserAtBottom(checkIfUserAtBottom());
  };

  // Auto-scroll to bottom only if user is at bottom or just sent message
  useEffect(() => {
    if (isUserAtBottom || userJustSentMessage) {
      scrollToBottom();
      if (userJustSentMessage) {
        setUserJustSentMessage(false);
      }
    }
  }, [messages, isUserAtBottom, userJustSentMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [newMessage]);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const compressImage = (file, maxWidth = 1024, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            // Convert blob to File with proper name
            const compressedFile = new File([blob], file.name || 'image.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, 'image/jpeg', quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleMediaSelect = async (event, type) => {
    const file = event.target.files[0];
    if (file) {
      setShowAttachmentMenu(false);

      if (type === 'image') {
        try {
          const compressedFile = await compressImage(file);
          setSelectedMediaFile(compressedFile);
          const mediaUrl = URL.createObjectURL(compressedFile);
          setSelectedMedia(mediaUrl);
          setMediaType('image');
        } catch (error) {
          console.error('Error compressing image:', error);
          setSelectedMediaFile(file);
          const mediaUrl = URL.createObjectURL(file);
          setSelectedMedia(mediaUrl);
          setMediaType('image');
        }
      } else if (type === 'video') {
        // Video without compression (for now)
        setSelectedMediaFile(file);
        const mediaUrl = URL.createObjectURL(file);
        setSelectedMedia(mediaUrl);
        setMediaType('video');
      }
    }
    // Reset file input
    event.target.value = '';
  };

  const removeSelectedMedia = () => {
    if (selectedMedia) {
      URL.revokeObjectURL(selectedMedia);
      setSelectedMedia(null);
      setSelectedMediaFile(null);
      setMediaType(null);
    }
  };

  const sendMessage = async () => {
    if ((newMessage.trim() || selectedMediaFile) && user && !loading) {
      setLoading(true);
      setUserJustSentMessage(true);

      try {
        let mediaUrl = null;
        let uploadedMediaType = null;

        // Upload media (image or video)
        if (selectedMediaFile) {
          const timestamp = Date.now();
          const fileExt = selectedMediaFile.name?.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg');
          const fileName = `chat/${user.uid}/${timestamp}_${mediaType}.${fileExt}`;
          const storageRef = ref(storage, fileName);

          await uploadBytes(storageRef, selectedMediaFile);
          mediaUrl = await getDownloadURL(storageRef);
          uploadedMediaType = mediaType;
        }

        const messageData = {
          sender: user.name,
          senderUid: user.uid,
          content: newMessage.trim(),
          image: uploadedMediaType === 'image' ? mediaUrl : null,
          video: uploadedMediaType === 'video' ? mediaUrl : null,
          replyTo: replyTo,
          createdAt: serverTimestamp(),
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`,
          reactions: []
        };

        await addDoc(collection(db, 'messages'), messageData);

        setNewMessage('');
        removeSelectedMedia();
        setReplyTo(null);
        setError(null);

        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setError('Chyba pri odosielaní správy');

        // Retry mechanism for iOS (only text, no media retry)
        if (!selectedMediaFile) {
          setTimeout(async () => {
            try {
              await addDoc(collection(db, 'messages'), {
                sender: user.name,
                senderUid: user.uid,
                content: newMessage.trim(),
                createdAt: serverTimestamp(),
                avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`,
                reactions: []
              });
              setNewMessage('');
              setError(null);
            } catch (retryError) {
              console.error('Retry failed:', retryError);
            }
          }, 1000);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      // Close picker immediately
      setShowReactionPicker(null);

      const messageRef = doc(db, 'messages', messageId);

      // Find the message to check existing reactions
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // Check if user already reacted with this emoji
      const existingReaction = message.reactions?.find(
        r => r.userId === user.uid && r.emoji === emoji
      );

      if (existingReaction) {
        // User already reacted with this emoji, don't add duplicate
        return;
      }

      const reaction = {
        emoji: emoji,
        userId: user.uid,
        userName: user.name
      };

      await updateDoc(messageRef, {
        reactions: arrayUnion(reaction)
      });

    } catch (error) {
      console.error('Error adding reaction:', error);
      setError('Chyba pri pridávaní reakcie');
    }
  };

  const handleLongPressStart = (messageId) => {
    const timer = setTimeout(() => {
      setShowReactionPicker(messageId);
    }, 500); // 500ms pre long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    textareaRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openMediaPreview = (mediaUrl, type) => {
    setShowMediaPreview({ url: mediaUrl, type });
  };

  const closeMediaPreview = () => {
    setShowMediaPreview(null);
  };

  const groupReactions = (reactions) => {
    if (!reactions || reactions.length === 0) return [];

    const grouped = {};
    reactions.forEach(reaction => {
      if (grouped[reaction.emoji]) {
        grouped[reaction.emoji].push(reaction.userName);
      } else {
        grouped[reaction.emoji] = [reaction.userName];
      }
    });

    return Object.entries(grouped).map(([emoji, users]) => ({
      emoji,
      count: users.length,
      users
    }));
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
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3"
      >
        {messages.map(message => {
          const isMe = user && message.senderUid === user.uid;
          const groupedReactions = groupReactions(message.reactions);

          return (
            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
              <div className={`flex items-end space-x-2 max-w-[75%] min-w-0 ${
                isMe ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {!isMe && (
                  <img
                    src={message.avatar}
                    alt={message.sender}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                <div>
                  {/* Reply preview */}
                  {message.replyTo && (
                    <div className={`mb-1 text-xs px-3 py-1 rounded-lg ${
                      isMe
                        ? 'bg-indigo-700 text-indigo-200'
                        : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-700'
                    }`}>
                      <p className="font-semibold">{message.replyTo.sender}</p>
                      <p className="truncate">{message.replyTo.content}</p>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    onTouchStart={() => handleLongPressStart(message.id)}
                    onTouchEnd={handleLongPressEnd}
                    onMouseDown={() => handleLongPressStart(message.id)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    className={`relative px-4 py-2 rounded-2xl shadow-sm ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : darkMode ? 'bg-gray-700 text-white rounded-bl-sm' : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                    }`}
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    {!isMe && (
                      <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {message.sender}
                      </p>
                    )}

                    {/* Image in message */}
                    {message.image && (
                      <div className="mb-2">
                        <img
                          src={message.image}
                          alt="Shared"
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openMediaPreview(message.image, 'image')}
                          style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    {/* Video in message */}
                    {message.video && (
                      <div className="mb-2">
                        <video
                          src={message.video}
                          controls
                          className="max-w-full rounded-lg"
                          style={{ maxHeight: '300px', maxWidth: '100%' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    {message.content && <p className="whitespace-pre-wrap break-words overflow-hidden">{message.content}</p>}

                    <div className="flex items-center justify-between mt-1 space-x-2">
                      <p className={`text-xs ${
                        isMe ? 'text-indigo-200' : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {message.createdAt?.toDate?.()?.toLocaleTimeString?.('sk-SK', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) || ''}
                      </p>
                      {!isMe && (
                        <button
                          onClick={() => handleReply(message)}
                          className={`text-xs ${
                            darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <i className="fas fa-reply"></i>
                        </button>
                      )}
                    </div>

                    {/* Reaction picker */}
                    {showReactionPicker === message.id && !isMe && (
                      <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-2 flex space-x-2 z-10">
                        {['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message.id, emoji)}
                            className="text-2xl hover:scale-125 transition-transform"
                            style={{
                              WebkitTapHighlightColor: 'transparent',
                              touchAction: 'manipulation'
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reactions display */}
                  {groupedReactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {groupedReactions.map(({ emoji, count, users }) => (
                        <div
                          key={emoji}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}
                          title={users.join(', ')}
                        >
                          <span>{emoji}</span>
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className={`px-4 py-2 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Odpovedáte na {replyTo.sender}
              </p>
              <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                {replyTo.content}
              </p>
            </div>
            <button
              onClick={cancelReply}
              className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Media preview */}
      {selectedMedia && (
        <div className={`px-4 py-2 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
          <div className="relative inline-block">
            {mediaType === 'image' ? (
              <img
                src={selectedMedia}
                alt="Preview"
                className="max-h-24 rounded-lg"
              />
            ) : (
              <video
                src={selectedMedia}
                className="max-h-24 rounded-lg"
                controls
              />
            )}
            <button
              onClick={removeSelectedMedia}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4`}>
        <div className="flex items-end space-x-2">
          {/* Hidden file inputs */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleMediaSelect(e, 'image')}
            className="hidden"
            ref={fileInputRef}
          />
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleMediaSelect(e, 'video')}
            className="hidden"
            ref={videoInputRef}
          />

          {/* Attachment menu button */}
          <div className="relative" ref={attachmentMenuRef}>
            <button
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              disabled={loading}
              className={`p-2 rounded-lg ${
                darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              <i className="fas fa-plus text-xl"></i>
            </button>

            {/* Attachment menu dropdown */}
            {showAttachmentMenu && (
              <div className={`absolute bottom-full mb-2 left-0 ${
                darkMode ? 'bg-gray-700' : 'bg-white'
              } rounded-lg shadow-xl border ${
                darkMode ? 'border-gray-600' : 'border-gray-200'
              } py-2 min-w-[200px] z-20`}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${
                    darkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-800'
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <i className="fas fa-image text-lg text-blue-500"></i>
                  <span>Fotka</span>
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${
                    darkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100 text-gray-800'
                  }`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <i className="fas fa-video text-lg text-purple-500"></i>
                  <span>Video</span>
                </button>
                <button
                  disabled
                  className={`w-full text-left px-4 py-3 flex items-center space-x-3 opacity-50 cursor-not-allowed ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  <i className="fas fa-file text-lg text-green-500"></i>
                  <span>Súbor (čoskoro)</span>
                </button>
                <button
                  disabled
                  className={`w-full text-left px-4 py-3 flex items-center space-x-3 opacity-50 cursor-not-allowed ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  <i className="fas fa-microphone text-lg text-red-500"></i>
                  <span>Hlasová správa (čoskoro)</span>
                </button>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!user || loading}
            placeholder="Napíšte správu..."
            className={`flex-1 px-4 py-2 rounded-2xl resize-none ${
              darkMode
                ? 'bg-gray-700 text-white placeholder-gray-400'
                : 'bg-gray-100 text-gray-800'
            }`}
            rows="1"
            style={{
              maxHeight: '120px',
              minHeight: '40px',
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          />

          <button
            onClick={sendMessage}
            onTouchStart={() => {}}
            disabled={!user || (!newMessage.trim() && !selectedMediaFile) || loading}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style={{
              WebkitTapHighlightColor: 'rgba(79, 70, 229, 0.3)',
              touchAction: 'manipulation',
              minWidth: '48px',
              minHeight: '48px'
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

      {/* Media lightbox */}
      {showMediaPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeMediaPreview}
        >
          <button
            onClick={closeMediaPreview}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
          >
            <i className="fas fa-times"></i>
          </button>
          {showMediaPreview.type === 'image' ? (
            <img
              src={showMediaPreview.url}
              alt="Preview"
              className="max-w-[90%] max-h-[90%] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={showMediaPreview.url}
              controls
              className="max-w-[90%] max-h-[90%]"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Chat;
