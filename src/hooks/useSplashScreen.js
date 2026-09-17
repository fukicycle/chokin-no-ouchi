import { useEffect, useState } from "react";
import { hideSplash, SPLASH_MIN_DURATION } from "../utils/splash";

/**
 * 起動時スプラッシュの表示を管理する。
 *
 * 認証状態が確定し、かつ最低表示時間を過ぎたらスプラッシュを閉じる。
 * 戻り値は「アプリ本体を描画してよいか」で、true になった瞬間に
 * スプラッシュのフェードアウトとアプリ本体の入場アニメーションが
 * 同時に始まる(クロスフェード)。
 *
 * @param {boolean} ready 認証状態の確定など、起動処理が終わったか
 * @returns {boolean} アプリ本体を描画してよいか
 */
export function useSplashScreen(ready) {
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!ready || finished) return;

    const remaining = Math.max(0, SPLASH_MIN_DURATION - performance.now());
    const timer = setTimeout(() => {
      hideSplash();
      setFinished(true);
    }, remaining);

    return () => clearTimeout(timer);
  }, [ready, finished]);

  return finished;
}
