import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// Kolekcia používateľov
const USERS_COLLECTION = 'users';

// Vytvorenie používateľského profilu
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userProfile = {
      id: uid,
      uid: uid,
      email: userData.email,
      name: userData.name || 'Používateľ',
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.email)}&background=4F46E5&color=fff`,
      role: userData.role || 'member', // 'admin' alebo 'member'
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    await setDoc(userRef, userProfile);
    return userProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Získanie používateľského profilu
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Aktualizácia používateľského profilu
export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const updatedData = {
      ...updates,
      updatedAt: new Date()
    };
    
    await updateDoc(userRef, updatedData);
    return updatedData;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Získanie všetkých používateľov (len pre adminov)
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Nastavenie role používateľa (len pre adminov)
export const setUserRole = async (uid, role) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      role: role,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
};

// Overenie či je používateľ admin
export const isUserAdmin = (user) => {
  return user && user.role === 'admin';
};