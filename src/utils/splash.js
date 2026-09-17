/**
 * index.html に直接埋め込んであるスプラッシュ(#splash)の制御。
 *
 * スプラッシュはバンドルの読み込み前に表示させたいのでHTML側に置いてあり、
 * 「いつ閉じるか」だけをアプリ側(useSplashScreen)から指示する。
 */

const SPLASH_ID = "splash";

/** フェードアウトにかける時間。index.html の #splash の transition と揃えること。 */
const EXIT_DURATION = 450;

/**
 * 最低表示時間(ミリ秒)。認証がキャッシュから即座に解決しても、
 * ロゴのポップアップが一瞬だけ光って消えるのを防ぐ。
 * 起点はページのナビゲーション開始時刻(= performance.now() の 0)。
 */
export const SPLASH_MIN_DURATION = 1100;

/**
 * スプラッシュをフェードアウトさせ、終わったらDOMから取り除く。
 * 二重に呼ばれても安全。
 */
export function hideSplash() {
  const splash = document.getElementById(SPLASH_ID);
  if (!splash || splash.dataset.hiding === "true") return;

  splash.dataset.hiding = "true";
  splash.classList.add("is-hiding");

  const remove = () => splash.remove();
  splash.addEventListener("transitionend", remove, { once: true });
  // バックグラウンドタブなどで transitionend が来ない場合の保険
  setTimeout(remove, EXIT_DURATION + 200);
}
