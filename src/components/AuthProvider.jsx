import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { AuthContext } from "../context/AuthContext";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = { currentUser, authLoading };

  // 認証の確定待ちでも children は描画する(App がスプラッシュ側で待つ)。
  // ここで描画を止めると、スプラッシュを閉じるタイミングを App から
  // 制御できなくなるため。
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
