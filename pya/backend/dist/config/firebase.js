"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.storage = exports.firestore = exports.auth = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
// Initialize Firebase Admin with multiple credential options for local/dev
if (!firebase_admin_1.default.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);
    let credential;
    // 1) Inline JSON in env var FIREBASE_SERVICE_ACCOUNT_JSON
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!credential && saJson) {
        try {
            const parsed = JSON.parse(saJson);
            credential = firebase_admin_1.default.credential.cert(parsed);
            console.log('[firebase] Using service account from FIREBASE_SERVICE_ACCOUNT_JSON');
        }
        catch (e) {
            console.warn('[firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, falling back...');
        }
    }
    // 2) Separate env vars FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
    if (!credential && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && projectId) {
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        // Replace literal \n with actual newlines (common in .env)
        const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
        credential = firebase_admin_1.default.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        });
        console.log('[firebase] Using service account from FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY');
    }
    // 3) GOOGLE_APPLICATION_CREDENTIALS file path
    const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credential && gacPath && fs_1.default.existsSync(gacPath)) {
        const fileJson = JSON.parse(fs_1.default.readFileSync(gacPath, 'utf8'));
        credential = firebase_admin_1.default.credential.cert(fileJson);
        console.log('[firebase] Using service account from GOOGLE_APPLICATION_CREDENTIALS path');
    }
    // 4) Last resort: application default (will fail locally without ADC)
    if (!credential) {
        console.warn('[firebase] No explicit credentials provided. Using applicationDefault(). Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON to avoid local failures.');
        credential = firebase_admin_1.default.credential.applicationDefault();
    }
    firebase_admin_1.default.initializeApp({
        credential,
        projectId,
        storageBucket,
    });
}
exports.auth = firebase_admin_1.default.auth();
exports.firestore = firebase_admin_1.default.firestore();
exports.storage = firebase_admin_1.default.storage();
exports.db = exports.firestore; // Alias for compatibility
