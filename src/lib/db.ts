import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const getFirebaseApp = () => {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };

  if (typeof window === 'undefined' && !process.env.FIREBASE_API_KEY) {
    throw new Error('Firebase configuration is missing. Please set environment variables.');
  }

  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
};

export const getFirestoreDb = () => {
  const app = getFirebaseApp();
  return getFirestore(app);
};