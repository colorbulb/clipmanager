import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyADGpgValITKs6zCNqkJTz2Dc5eENVh6-Y",
  authDomain: "nextelite-89f47.firebaseapp.com",
  databaseURL: "https://nextelite-89f47-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nextelite-89f47",
  storageBucket: "nextelite-89f47.firebasestorage.app",
  messagingSenderId: "106713038598",
  appId: "1:106713038598:web:5add1c1b254f4c43e96887",
  measurementId: "G-MW5TCJZQYH"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
