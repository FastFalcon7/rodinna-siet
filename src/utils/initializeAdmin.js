import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserProfile, getAllUsers } from '../services/userService';

// Inicializácia prvého admin používateľa
export const initializeFirstAdmin = async (email, password, name) => {
  try {
    // Skontroluj či už existujú nejakí používatelia
    const existingUsers = await getAllUsers();
    
    if (existingUsers.length > 0) {
      throw new Error('Používatelia už existujú. Prvý admin už bol vytvorený.');
    }
    
    // Vytvor prvého používateľa
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Aktualizuj displayName
    if (name) {
      await updateProfile(user, { displayName: name });
    }
    
    // Vytvor admin profil v Firestore
    const adminProfile = await createUserProfile(user.uid, {
      email: user.email,
      name: name || 'Admin',
      role: 'admin'
    });
    
    console.log('Prvý admin používateľ bol úspešne vytvorený:', adminProfile);
    return adminProfile;
    
  } catch (error) {
    console.error('Chyba pri vytváraní prvého admin používateľa:', error);
    throw error;
  }
};