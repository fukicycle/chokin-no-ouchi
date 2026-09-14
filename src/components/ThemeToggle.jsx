import React from "react";
import { useTheme } from "../context/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

// スイッチ型のテーマ切替: つまみの位置とアイコンで「今どちらのモードか」が
// 一目でわかるようにする（従来の単一アイコンは"切替先"を示していて分かりづらかったため）
const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      title={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      className={`relative w-14 h-8 flex-shrink-0 rounded-full border transition-colors duration-300 shadow-sm ${
        isDark
          ? "bg-slate-900/60 border-white/10"
          : "bg-amber-100/70 border-cyan-800/20"
      } ${className}`}
    >
      <span className="absolute inset-0 flex items-center justify-between px-2">
        <FontAwesomeIcon
          icon={faSun}
          className={`text-[11px] transition-opacity duration-300 ${
            isDark ? "opacity-25 text-white" : "opacity-100 text-amber-500"
          }`}
        />
        <FontAwesomeIcon
          icon={faMoon}
          className={`text-[11px] transition-opacity duration-300 ${
            isDark ? "opacity-100 text-cyan-300" : "opacity-25 text-cyan-800"
          }`}
        />
      </span>
      <span
        className={`absolute top-0.5 left-0.5 w-7 h-7 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        <FontAwesomeIcon
          icon={isDark ? faMoon : faSun}
          className={`text-xs ${isDark ? "text-cyan-600" : "text-amber-500"}`}
        />
      </span>
    </button>
  );
};

export default ThemeToggle;
