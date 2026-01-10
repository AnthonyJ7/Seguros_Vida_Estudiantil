import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Initialize Firebase Admin with multiple credential options for local/dev
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);

  let credential: admin.credential.Credential | undefined;

  // 1) Inline JSON in env var FIREBASE_SERVICE_ACCOUNT_JSON
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!credential && saJson) {
    try {
      const parsed = JSON.parse(saJson);
      credential = admin.credential.cert(parsed as admin.ServiceAccount);
      console.log('[firebase] Using service account from FIREBASE_SERVICE_ACCOUNT_JSON');
    } catch (e) {
      console.warn('[firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, falling back...');
    }
  }

  // 2) Separate env vars FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
  if (!credential && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && projectId) {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Replace literal \n with actual newlines (common in .env)
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    credential = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });
    console.log('[firebase] Using service account from FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY');
  }

  // 3) GOOGLE_APPLICATION_CREDENTIALS file path
  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credential && gacPath && fs.existsSync(gacPath)) {
    const fileJson = JSON.parse(fs.readFileSync(gacPath, 'utf8'));
    credential = admin.credential.cert(fileJson as admin.ServiceAccount);
    console.log('[firebase] Using service account from GOOGLE_APPLICATION_CREDENTIALS path');
  }

  // 4) Last resort: application default (will fail locally without ADC)
  if (!credential) {
    console.warn('[firebase] No explicit credentials provided. Using applicationDefault(). Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON to avoid local failures.');
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential,
    projectId,
    storageBucket,
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();
export const db = firestore; // Alias for compatibility
