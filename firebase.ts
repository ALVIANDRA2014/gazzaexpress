import firebase from 'firebase/compat/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA_2_rlEpvAXx27mfBuk294o0QPQA6CUJg",
  authDomain: "gazza-express-8d206.firebaseapp.com",
  projectId: "gazza-express-8d206",
  storageBucket: "gazza-express-8d206.firebasestorage.app",
  messagingSenderId: "623842722890",
  appId: "1:623842722890:web:ffcaf6ac215756a1f992b3",
  measurementId: "G-5ED11GEMMN"
};

const app = firebase.initializeApp(firebaseConfig);
export const db = getFirestore(app as any);