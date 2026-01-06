import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCt6N5EvHyYJL0nGVv_qyaMcb_REpTa2yw",
  authDomain: "segurosvidaestiudiantilutpl.firebaseapp.com",
  projectId: "segurosvidaestiudiantilutpl",
  storageBucket: "segurosvidaestiudiantilutpl.firebasestorage.app",
  messagingSenderId: "158820060268",
  appId: "1:158820060268:web:5f1f995aab798388f65c49",
  measurementId: "G-WVC1SMH3FT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);