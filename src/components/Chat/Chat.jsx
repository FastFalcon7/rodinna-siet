import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOnlineStatus } from '../../contexts/OnlineStatusContext';
import { db } from '../../firebase/config';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { onlineCount } = useOnlineStatus();

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


  const sendMessage = async () => {
    if (newMessage.trim() && user && !loading) {
      setLoading(true);
      try {
        await addDoc(collection(db, 'messages'), {
          sender: user.name,
          senderUid: user.uid,
          content: newMessage.trim(),
          createdAt: serverTimestamp(),
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`
        });
        setNewMessage('');
        setError(null);
      } catch (error) {
        console.error('Error sending message:', error);
        setError('Chyba pri odosielaní správy');
        
        // Retry mechanism for iOS
        setTimeout(async () => {
          try {
            await addDoc(collection(db, 'messages'), {
              sender: user.name,
              senderUid: user.uid,
              content: newMessage.trim(),
              createdAt: serverTimestamp(),
              avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`
            });
            setNewMessage('');
            setError(null);
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }, 1000);
      } finally {
        setLoading(false);
      }
    }
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
                  <p>{message.content}</p>
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
      </div>

      {/* Input */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4`}>
        <div className="flex space-x-2">
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
            disabled={!user}
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
          <button
            onClick={sendMessage}
            onTouchStart={() => {}}
            disabled={!user || !newMessage.trim() || loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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