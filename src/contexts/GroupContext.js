import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GroupContext = createContext();

export function useGroups() {
  return useContext(GroupContext);
}

export function GroupProvider({ children }) {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Načítanie skupín užívateľa
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading groups:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Vytvorenie novej skupiny
  const createGroup = async (groupData) => {
    try {
      const newGroup = {
        name: groupData.name,
        description: groupData.description || '',
        avatar: groupData.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(groupData.name) + '&background=4F46E5&color=fff',
        members: [user.uid, ...groupData.members],
        admins: [user.uid],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'groups'), newGroup);
      return { id: docRef.id, ...newGroup };
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  // Pridanie člena do skupiny
  const addMember = async (groupId, memberUid) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(memberUid),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  };

  // Odstránenie člena zo skupiny
  const removeMember = async (groupId, memberUid) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(memberUid),
        admins: arrayRemove(memberUid), // Remove from admins too if present
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  };

  // Aktualizácia skupiny
  const updateGroup = async (groupId, updates) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };

  // Opustenie skupiny
  const leaveGroup = async (groupId) => {
    try {
      await removeMember(groupId, user.uid);
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  };

  const value = {
    groups,
    activeGroup,
    setActiveGroup,
    loading,
    createGroup,
    addMember,
    removeMember,
    updateGroup,
    leaveGroup
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}
