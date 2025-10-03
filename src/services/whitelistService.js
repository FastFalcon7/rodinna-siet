import { db } from '../firebase/config';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const WHITELIST_DOC_ID = 'allowedEmails';

// Získaj zoznam povolených emailov
export const getAllowedEmails = async () => {
  try {
    const docRef = doc(db, 'config', WHITELIST_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().emails || [];
    }

    // Ak whitelist neexistuje, vytvor prázdny
    await setDoc(docRef, { emails: [] });
    return [];
  } catch (error) {
    console.error('Chyba pri načítaní whitelistu:', error);
    throw error;
  }
};

// Skontroluj, či je email povolený
export const isEmailAllowed = async (email) => {
  try {
    const emails = await getAllowedEmails();
    return emails.includes(email.toLowerCase());
  } catch (error) {
    console.error('Chyba pri kontrole emailu:', error);
    return false;
  }
};

// Pridaj email do whitelistu (len admin)
export const addEmailToWhitelist = async (email) => {
  const docRef = doc(db, 'config', WHITELIST_DOC_ID);
  try {
    await updateDoc(docRef, {
      emails: arrayUnion(email.toLowerCase())
    });
  } catch (error) {
    // Ak dokument neexistuje, vytvor ho
    if (error.code === 'not-found') {
      await setDoc(docRef, { emails: [email.toLowerCase()] });
    } else {
      throw error;
    }
  }
};

// Odstráň email z whitelistu (len admin)
export const removeEmailFromWhitelist = async (email) => {
  try {
    const docRef = doc(db, 'config', WHITELIST_DOC_ID);
    await updateDoc(docRef, {
      emails: arrayRemove(email.toLowerCase())
    });
  } catch (error) {
    console.error('Chyba pri odstraňovaní emailu:', error);
    throw error;
  }
};

// Inicializuj whitelist s prvým admin emailom
export const initializeWhitelist = async (adminEmail) => {
  try {
    const docRef = doc(db, 'config', WHITELIST_DOC_ID);
    await setDoc(docRef, { emails: [adminEmail.toLowerCase()] });
  } catch (error) {
    console.error('Chyba pri inicializácii whitelistu:', error);
    throw error;
  }
};
