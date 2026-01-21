import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { hashPin } from '../utils/crypto';

const SHARE_COLLECTION = 'clipShares';

export const createShareLink = async ({ clip, ownerId, pin }) => {
  const pinHash = await hashPin(pin);
  const docRef = await addDoc(collection(db, SHARE_COLLECTION), {
    ownerId,
    clipId: clip.id,
    clipSnapshot: {
      title: clip.title || '',
      content: clip.content || '',
      images: clip.images || [],
      tags: clip.tags || [],
      category: clip.category || ''
    },
    pinHash,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
};

export const getShareById = async (shareId) => {
  const shareRef = doc(db, SHARE_COLLECTION, shareId);
  const shareSnap = await getDoc(shareRef);
  if (!shareSnap.exists()) {
    return null;
  }
  return { id: shareSnap.id, ...shareSnap.data() };
};

export const subscribeToContributions = (shareId, callback) => {
  const contributionsRef = collection(db, SHARE_COLLECTION, shareId, 'contributions');
  const q = query(contributionsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const contributions = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      contributions.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      });
    });
    callback(contributions);
  });
};

export const addContribution = async (shareId, contribution) => {
  const contributionsRef = collection(db, SHARE_COLLECTION, shareId, 'contributions');
  await addDoc(contributionsRef, {
    ...contribution,
    createdAt: serverTimestamp()
  });
};
