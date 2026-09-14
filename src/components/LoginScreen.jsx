import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { ensureUserDoc } from "../firebase/ensureUserDoc";
import { useTheme } from "../context/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

const LoginScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const [signInError, setSignInError] = useState(null);

  const handleGoogleSignIn = async () => {
    setSignInError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(result.user);
    } catch (error) {
      console.error("Google認証エラー:", error);
      setSignInError(`${error.code || "unknown"}: ${error.message || error}`);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full overflow-y-auto px-4 pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.5rem))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] transition-colors duration-300">
      {/* 右上のフローティング・テーマ切替ボタン（ログイン前でも切り替え可能に）
          ステータスバーの下に潜り込まないようセーフエリアぶん下げる */}
      <div className="absolute right-6 top-[calc(1.5rem+env(safe-area-inset-top,0px))]">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center text-cyan-800 dark:text-cyan-400 bg-white/40 dark:bg-black/25 border border-white/50 dark:border-white/10 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
          title={theme === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え"}
        >
          <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} className="text-base" />
        </button>
      </div>

      {/* グラスモルフィズムカード（コントラスト・アクセシビリティを強化） */}
      <div className="glass-card w-full max-w-sm p-8 space-y-6 rounded-3xl shadow-xl text-center border border-white/30 dark:border-white/10">
        <div className="space-y-3">
          <span className="text-[11px] font-extrabold tracking-widest text-cyan-800 dark:text-cyan-400 uppercase bg-cyan-100 dark:bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-200/50 dark:border-cyan-800/10 inline-block">
            家計をみんなで共有
          </span>
          <h1 className="text-3.5xl font-black text-slate-800 dark:text-white tracking-tight">
            貯金のおうち
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold px-2">
            家族みんなで、もっとスマートに楽しく家計管理
          </p>
        </div>
        
        <div className="pt-2">
          {/* 高コントラストのサインインボタン (ライト時: より濃いピンク、ダーク時: 明るいピンク) */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-4 text-base font-bold text-white bg-pink-600 dark:bg-pink-600 rounded-xl shadow-lg hover:bg-pink-700 dark:hover:bg-pink-500 hover:scale-[1.03] active:scale-95 transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Googleでサインイン
          </button>
        </div>

        {signInError && (
          <p className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
            ログインエラー: {signInError}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
