import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use your copied config here!
const firebaseConfig = {
  apiKey: "AIzaSyDwwPjqhhupmJdUZRT0g_Ws6J5Yjbzj6vs",
  authDomain: "zenspace-ai.firebaseapp.com",
  projectId: "zenspace-ai",
  storageBucket: "zenspace-ai.firebasestorage.app",
  messagingSenderId: "351371612681",
  appId: "1:351371612681:web:eaf1bf4ec3870af0a6ded8",
  measurementId: "G-43Y1FY2BGW"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
