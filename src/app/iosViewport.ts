// iPhone のホーム画面から開いたとき（ステータスバーが black-translucent）、
// 画面全体に描かれるのに、ページの高さだけがステータスバーの分だけ短くなることがある。
// そのままだと画面の下端に、何も描かれない黒い帯が残る。
//
// 起きるかどうかは端末と OS の版によるので、決め打ちで伸ばさず
// 「画面の高さ」と「ページの高さ」の差を測り、差があるときだけその分ページを伸ばす。
// （v1 の src/utils/iosViewport.js と同じ考え方）

// ステータスバーより大きな差は測り違い（横向きの直後など）とみなす
const MAX_SHIM_PX = 120;

const isStandalone = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  matchMedia("(display-mode: standalone)").matches;

const measure = () => {
  if (!isStandalone()) return 0;
  const shortfall = Math.round(screen.height - window.innerHeight);
  return shortfall > 0 && shortfall <= MAX_SHIM_PX ? shortfall : 0;
};

const apply = () => {
  const shim = measure();
  document.documentElement.style.setProperty("--ios-bottom-shim", `${shim}px`);
  document.documentElement.classList.toggle("ios-bottom-shim", shim > 0);
};

export function setupIosViewport() {
  apply();
  window.addEventListener("resize", apply);
  // 向きを変えた直後は古い大きさが返るので、落ち着いてから測り直す
  window.addEventListener("orientationchange", () => setTimeout(apply, 300));
  // 伸ばした分ページが動けてしまうので、引っぱってもずれないよう先頭に戻す
  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY !== 0 && document.documentElement.classList.contains("ios-bottom-shim")) {
        window.scrollTo(0, 0);
      }
    },
    { passive: true },
  );
}
