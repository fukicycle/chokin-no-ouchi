/**
 * アプリバー(ヘッダー)の色。
 *
 * iOSのstandalone PWAでは、WebViewがステータスバーの下から始まり、
 * ステータスバーの帯はOS側が theme-color で塗る。帯とヘッダーの色が違うと
 * 段差に見えるため、ヘッダーの背景色とこの theme-color を必ず同じ値にする。
 * (WebViewがステータスバーの下まで広がる端末では、ヘッダー自身の
 *  padding-top: env(safe-area-inset-top) が同じ色でその帯を塗る)
 *
 * 値は src/styles/App.css の .app-header と一致させること。
 */
export const CHROME_COLORS = {
  light: "#f2fafd",
  dark: "#0c1222",
};

/** アプリ内のテーマ切替に追従して <meta name="theme-color"> を書き換える */
export function applyChromeColor(theme) {
  const color = CHROME_COLORS[theme] || CHROME_COLORS.light;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
}
