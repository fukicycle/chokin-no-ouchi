// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0N-m_JN0ozQ3g9cnXzpv3A_vUO7O3Ycw",
  authDomain: "chokin-no-ouchi.firebaseapp.com",
  databaseURL:
    "https://chokin-no-ouchi-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "chokin-no-ouchi",
  storageBucket: "chokin-no-ouchi.firebasestorage.app",
  messagingSenderId: "467441086151",
  appId: "1:467441086151:web:a3eb76398a87da6a3c58e2",
  measurementId: "G-9DR5XNJ0RX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
