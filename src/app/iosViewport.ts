// iPhone のホーム画面から開いたとき（ステータスバーが black-translucent）の、画面の高さのずれを直す。
// fukicycle/mojifuru の src/viewport.ts と同じ考え方（あちらで帯が出ないことを確かめてある）。
//
// iOS には、端末・OS の版・ホーム画面に追加したときの設定によって2通りの動きがある。
//  - A：画面はステータスバーの下から始まる。上の帯は OS が theme-color で塗る
//  - B：画面全体に描かれるのに、ページの高さ（innerHeight）だけがステータスバーの分だけ短い。
//       そのままだと画面の下端に、何も描かれない黒い帯が残る
// B のずれを実測して --ios-bottom-shim に入れ、その分だけページを伸ばす（決め打ちで伸ばすと、
// ずれていない端末でページがはみ出す）。伸ばした分が切り取られないよう、そのときだけ
// html・body の overflow: hidden を外す（app.css）。これが無いと帯は消えない。
//
// あわせて --app-vh に実際の画面の高さを入れる。iOS はアプリに戻ってきたときなどに
// 100dvh を計算し直さないことがあるため、戻ってくるたびに測り直す。
// 高さは innerHeight で測る（visualViewport はキーボードを出すと縮むので、入力のたびに画面全体が
// 縮んでガクンと動いてしまう。キーボードとの位置合わせは iOS に任せる）。

// ステータスバーより大きな差は測り違い（ブラウザのバーなど）とみなす
const MAX_SHIM_PX = 120;

export function measureBottomShim(screenHeight: number, innerHeight: number) {
  const shortfall = Math.round(screenHeight - innerHeight);
  return Number.isFinite(shortfall) && shortfall > 0 && shortfall <= MAX_SHIM_PX ? shortfall : 0;
}

const isStandalone = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  matchMedia("(display-mode: standalone)").matches;

export function setupIosViewport() {
  const root = document.documentElement;
  let frame = 0;
  let rotateTimer = 0;

  const apply = () => {
    if (document.visibilityState === "hidden") return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      root.style.setProperty("--app-vh", `${window.innerHeight}px`);
      const shim = isStandalone() ? measureBottomShim(screen.height, window.innerHeight) : 0;
      root.style.setProperty("--ios-bottom-shim", `${shim}px`);
      root.classList.toggle("ios-bottom-shim", shim > 0);
    });
  };

  apply();
  window.addEventListener("resize", apply);
  window.addEventListener("pageshow", apply);
  window.addEventListener("focus", apply);
  document.addEventListener("visibilitychange", apply);
  // 向きを変えた直後は古い大きさが返るので、落ち着いてから測り直す
  window.addEventListener("orientationchange", () => {
    clearTimeout(rotateTimer);
    rotateTimer = window.setTimeout(apply, 300);
  });
  // 伸ばした分だけページが動けてしまうので、引っぱられても先頭に留める
  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY !== 0 && root.classList.contains("ios-bottom-shim")) window.scrollTo(0, 0);
    },
    { passive: true },
  );
}
