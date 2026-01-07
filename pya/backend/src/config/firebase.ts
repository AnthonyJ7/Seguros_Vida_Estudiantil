import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Prefer application default credentials; fallback to GOOGLE_APPLICATION_CREDENTIALS path
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();
export const db = firestore; // Alias for compatibility
