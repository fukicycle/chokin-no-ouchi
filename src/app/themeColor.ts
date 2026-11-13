// 画面上端（ブラウザのバー・Android のステータスバー）の色を、いま表示しているテーマの地の色に合わせる。
// テーマ（自動・昼・夜）を切り替えたときと、端末の昼夜が変わったときに書き換える。
const sync = () => {
  const color = getComputedStyle(document.documentElement).getPropertyValue("--fk-ground-1").trim();
  if (!color) return;
  // 端末の昼夜ごとの2つの meta を、どちらもいまの色にする（どちらが効いても合うように）
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", color));
};

export function syncThemeColor() {
  sync();
  new MutationObserver(sync).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", sync);
}
