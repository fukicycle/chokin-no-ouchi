// グラフ（SVG の属性）には CSS 変数を書けないので、いまの色を読み取って渡す。
// テーマ（自動・昼・夜）が変わったら読み直す。
import { useEffect, useState } from "react";

const read = () => {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    ink: v("--fk-ink"),
    muted: v("--app-ink-muted"),
    accent: v("--fk-accent"),
    hair: v("--fk-hair"),
    ground: v("--fk-ground-1"),
    error: v("--app-error"),
  };
};

export type ThemeColors = ReturnType<typeof read>;

export function useThemeColors() {
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const update = () => setColors(read());
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, []);
  return colors;
}
