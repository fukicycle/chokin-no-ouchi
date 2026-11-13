import { useCallback, useState } from "react";
import { load, save } from "../lib/storage";

export type ThemeMode = "auto" | "light" | "dark";

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "auto") delete root.dataset.theme;
  else root.dataset.theme = mode;
}

/** 表示 ＞ テーマ。自動（端末に合わせる）・昼・夜 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => load<ThemeMode>("theme", "auto"));
  const set = useCallback((next: ThemeMode) => {
    setMode(next);
    save("theme", next);
    applyTheme(next);
  }, []);
  return [mode, set] as const;
}
