import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBqG__kop-3vRZBHw3BtYPCPqC-6PWd_GI",
  authDomain: "orion-assistant-60614.firebaseapp.com",
  projectId: "orion-assistant-60614",
  storageBucket: "orion-assistant-60614.firebasestorage.app",
  messagingSenderId: "243855956544",
  appId: "1:243855956544:web:3c6c02457da93e31595da5",
  measurementId: "G-KW3789DVZ6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);