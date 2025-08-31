import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase/config';
import { doc, onSnapshot, setDoc, deleteDoc, collection } from 'firebase/firestore';

const OnlineStatusContext = createContext();

export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within OnlineStatusProvider');
  }
  return context;
};

export const OnlineStatusProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();
  
  // Detekcia iPhone
  const isIPhone = () => {
    const ua = navigator.userAgent;
    return /iPhone/.test(ua) && !window.MSStream;
  };

  useEffect(() => {
    if (!user) return;

    // Nastaviť užívateľa ako online
    const setUserOnline = async () => {
      try {
        await setDoc(doc(db, 'onlineUsers', user.uid), {
          uid: user.uid,
          name: user.name,
          avatar: user.avatar,
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Error setting user online:', error);
      }
    };

    // Nastaviť užívateľa ako offline pri zatvorení
    const setUserOffline = async () => {
      try {
        await deleteDoc(doc(db, 'onlineUsers', user.uid));
      } catch (error) {
        console.error('Error setting user offline:', error);
      }
    };

    // Nastaviť online status
    setUserOnline();

    let unsubscribeOnline;
    
    if (isIPhone()) {
      // Fallback: polling pre iPhone
      const pollOnlineUsers = async () => {
        try {
          const { getDocs } = await import('firebase/firestore');
          const snapshot = await getDocs(collection(db, 'onlineUsers'));
          const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOnlineUsers(users);
        } catch (error) {
          console.error('iPhone polling online users error:', error);
        }
      };

      // Okamžité načítanie
      pollOnlineUsers();
      
      // Polling každých 5 sekúnd
      const pollInterval = setInterval(pollOnlineUsers, 5000);
      unsubscribeOnline = () => clearInterval(pollInterval);
      
    } else {
      // Normálny real-time listener
      unsubscribeOnline = onSnapshot(collection(db, 'onlineUsers'), (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOnlineUsers(users);
      });
    }

    // Cleanup pri odhlásení alebo zatvorení
    const cleanup = () => {
      setUserOffline();
    };

    // Event listeners pre zatvorenie (iOS Safari kompatibilita)
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
    window.addEventListener('pagehide', cleanup); // Pridané pre iOS Safari
    
    // Visibility API pre iOS Safari
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setUserOnline();
      } else {
        setUserOffline();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Heartbeat každých 30 sekúnd
    const heartbeatInterval = setInterval(() => {
      setUserOnline();
    }, 30000);

    return () => {
      unsubscribeOnline();
      cleanup();
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('unload', cleanup);
      window.removeEventListener('pagehide', cleanup);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const value = {
    onlineUsers,
    onlineCount: onlineUsers.length
  };

  return (
    <OnlineStatusContext.Provider value={value}>
      {children}
    </OnlineStatusContext.Provider>
  );
};