import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc
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

  await updateDoc(doc(db, 'clips', clip.id), {
    shareId: docRef.id,
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

export const updateSharedClip = async ({ shareId, clipId, clipData, editorName }) => {
  const shareRef = doc(db, SHARE_COLLECTION, shareId);
  const clipRef = doc(db, 'clips', clipId);

  const snapshotUpdate = {
    title: clipData.title || '',
    content: clipData.content || '',
    images: clipData.images || [],
    tags: clipData.tags || [],
    category: clipData.category || ''
  };

  await updateDoc(shareRef, {
    clipSnapshot: snapshotUpdate,
    updatedAt: serverTimestamp(),
    lastSharedEditorName: editorName || ''
  });

  await updateDoc(clipRef, {
    ...snapshotUpdate,
    lastSharedEditId: shareId,
    lastSharedEditorName: editorName || '',
    lastSharedEditedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};
