import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { createUserProfile, getUserProfile } from '../services/userService';
import { isEmailAllowed, initializeWhitelist } from '../services/whitelistService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Pokús sa získať profil z Firestore
          let userProfile = await getUserProfile(firebaseUser.uid);
          
          // Ak profil neexistuje, vytvor ho
          if (!userProfile) {
            userProfile = await createUserProfile(firebaseUser.uid, {
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Používateľ'
            });
          } else if (!userProfile.uid) {
            // Zabezpeč že userProfile má uid property
            userProfile.uid = firebaseUser.uid;
          }
          
          setUser(userProfile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Fallback na Firebase údaje
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Používateľ',
            avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}&background=4F46E5&color=fff`,
            role: 'member'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, name, isFirstUser = false) => {
    try {
      // Ak je to prvý používateľ, inicializuj whitelist s jeho emailom
      if (isFirstUser) {
        await initializeWhitelist(email);
      } else {
        // Pre ostatných používateľov skontroluj whitelist
        const allowed = await isEmailAllowed(email);
        if (!allowed) {
          throw new Error('Tento email nie je povolený. Kontaktujte administrátora.');
        }
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Aktualizuj displayName vo Firebase Auth
      if (name) {
        await updateProfile(user, { displayName: name });
      }

      // Vytvor profil v Firestore
      const role = isFirstUser ? 'admin' : 'member';
      await createUserProfile(user.uid, {
        email: user.email,
        name: name || 'Používateľ',
        role: role
      });

      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};