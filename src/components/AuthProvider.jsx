import React, { useEffect, useState } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "../firebase/config";
import { ensureUserDoc } from "../firebase/ensureUserDoc";
import { AuthContext } from "../context/AuthContext";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // iOS等のsignInWithRedirectで戻ってきた場合、ユーザードキュメントを作成する
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          ensureUserDoc(result.user);
        }
      })
      .catch((error) => {
        console.error("リダイレクト認証エラー:", error);
        setAuthError(`${error.code || "unknown"}: ${error.message || error}`);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = { currentUser, authError };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
