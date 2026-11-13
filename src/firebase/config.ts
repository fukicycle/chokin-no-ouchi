// Firebase の接続先（v1 と同じプロジェクト。家族の記録はそのまま引き継がれる）。
// Web アプリの設定値は公開してよいもので、データはセキュリティルール（database.rules.json）で守る。
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const app = initializeApp({
  apiKey: "AIzaSyD0N-m_JN0ozQ3g9cnXzpv3A_vUO7O3Ycw",
  authDomain: "chokin-no-ouchi.firebaseapp.com",
  databaseURL: "https://chokin-no-ouchi-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "chokin-no-ouchi",
  storageBucket: "chokin-no-ouchi.firebasestorage.app",
  messagingSenderId: "467441086151",
  appId: "1:467441086151:web:a3eb76398a87da6a3c58e2",
});

export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
