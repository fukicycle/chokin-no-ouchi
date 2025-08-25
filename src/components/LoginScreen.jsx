import React from "react";
import { signInWithPopup } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database, googleProvider } from "../firebase/config";

const LoginScreen = () => {
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        const familyId = Math.random().toString(36).substring(2, 10).toUpperCase();
        await set(userRef, {
          email: user.email,
          displayName: user.displayName,
          familyId,
        });
      }
    } catch (error) {
      console.error("Google認証エラー:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-bg-primary">
      <div className="w-full max-w-sm p-6 space-y-6 bg-translucent-light backdrop-blur-md border border-white/20 rounded-3xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-text-dark">Chokin no Ouchi</h1>
        <p className="text-sm text-gray-700">家族みんなで楽しく家計管理</p>
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 text-lg font-semibold text-white bg-accent-pink rounded-xl shadow-md transform transition-transform duration-200 hover:scale-105"
        >
          Googleでサインイン
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
