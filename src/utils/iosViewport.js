/**
 * iOSのstandalone PWA (apple-mobile-web-app-status-bar-style: black-translucent)
 * では、WebViewは画面全体に描かれるのに、レイアウトビューポートだけが
 * ステータスバーの高さぶん短くなることがある。その結果、画面下端に
 * ちょうど safe-area-inset-top と同じ高さの「地の白」の帯が残る。
 *
 * 参考Tips (Make your PWAs look handsome on iOS) では
 * `min-height: calc(100% + env(safe-area-inset-top))` で文書を伸ばして塞ぐが、
 * この不一致が起きるかどうかは端末/OSバージョン依存なので、決め打ちで伸ばすと
 * 正常な端末では逆に文書がはみ出してしまう。
 * そこで「画面の高さ」と「レイアウトビューポートの高さ」の差を実測し、
 * 不一致があるときだけ CSS変数 --ios-bottom-shim にその値を入れる。
 * 不一致が無い環境(Android/PC/Safariタブ/正常なiOS)では常に 0px のままなので、
 * レイアウトは一切変わらない。
 */

// ステータスバー相当の高さを超える差分は測定ミス(横向き時のscreen.height等)とみなす
const MAX_SHIM_PX = 120;

const isStandalone = () =>
  window.navigator.standalone === true ||
  (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);

const measureShim = () => {
  if (!isStandalone() || !window.screen) return 0;
  const shortfall = Math.round(window.screen.height - window.innerHeight);
  if (!Number.isFinite(shortfall) || shortfall <= 0 || shortfall > MAX_SHIM_PX) return 0;
  return shortfall;
};

const applyShim = () => {
  const shim = measureShim();
  const root = document.documentElement;
  root.style.setProperty("--ios-bottom-shim", `${shim}px`);
  root.classList.toggle("ios-bottom-shim", shim > 0);
  return shim;
};

export function setupIosViewport() {
  applyShim();

  // 回転や分割表示でビューポート高さが変わったら測り直す
  window.addEventListener("resize", applyShim);
  window.addEventListener("orientationchange", () => {
    // orientationchange 直後はまだ旧サイズが返るため、確定後に測る
    window.setTimeout(applyShim, 300);
  });

  // シムぶんだけ文書がビューポートより高くなるので、ヘッダーやボトムナビを
  // 引っぱってもアプリ全体がずれないようにスクロール位置を先頭へ固定する。
  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY !== 0 && document.documentElement.classList.contains("ios-bottom-shim")) {
        window.scrollTo(0, 0);
      }
    },
    { passive: true }
  );
}
