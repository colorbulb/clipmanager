import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const COLLECTION_NAME = 'clips';

export const subscribeToClips = (userId, callback) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const clips = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      clips.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
      });
    });
    
    // Sort in memory instead of using Firestore orderBy
    clips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    callback(clips);
  }, (error) => {
    console.error('Error fetching clips:', error);
    if (error.code === 'permission-denied') {
      alert('Permission denied. Please check Firestore security rules.');
    }
  });
};

export const addClip = async (userId, clipData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...clipData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding clip:', error);
    throw error;
  }
};

export const updateClip = async (clipId, clipData) => {
  try {
    const clipRef = doc(db, COLLECTION_NAME, clipId);
    await updateDoc(clipRef, {
      ...clipData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating clip:', error);
    throw error;
  }
};

export const deleteClip = async (clipId) => {
  try {
    const clipRef = doc(db, COLLECTION_NAME, clipId);
    await deleteDoc(clipRef);
  } catch (error) {
    console.error('Error deleting clip:', error);
    throw error;
  }
};
