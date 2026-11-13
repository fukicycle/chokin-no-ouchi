import { useEffect, useRef, useState } from "react";

// 見たことのある key の最新の値。タブを行き来したときに、読み込み直す間も前の値を出してすぐ描けるようにする
const cache = new Map<string, unknown>();

/**
 * Firebase の購読。key は覚えておく場所の名前も兼ねるので、何のデータかを頭に付ける
 * （例："expenses|{familyId}|…"、"budget|{familyId}"）。同じ key を別のデータに使わない。key（何を見ているか）が null（ログイン前など）なら購読しない。
 *
 * 画面がガクンと崩れないように：
 * - 前に見た key なら、覚えている値をすぐ返す
 * - keepPrevious のときは、初めての key でも届くまで直前に見せていた値を出し続ける（月を送ったときなど）。
 *   「記録がありません」が一瞬出て、また中身が出る、というちらつきを防ぐ。
 *   見せるだけの一覧に限って使う。家族・ユーザー・固定費のように、別の人や別の家族の値を
 *   一瞬でも使うと困るもの（書き込みの元になるもの）には使わない
 * loading：今の key の値も、代わりに出せる値もない（最初の読み込み）
 * refreshing：直前の値を出しながら、今の key の値を待っている
 * fresh：今の key の値を、いまの購読で受け取った（覚えていた値ではない）。書き込みの判断はこれを待つ
 */
export function useLive<T>(
  key: string | null,
  listen: (set: (v: T) => void) => () => void,
  empty: T,
  { keepPrevious = false }: { keepPrevious?: boolean } = {},
) {
  const [state, setState] = useState<{ key: string; value: T } | null>(() =>
    key !== null && cache.has(key) ? { key, value: cache.get(key) as T } : null,
  );
  const listenRef = useRef(listen);
  // いまの購読で値を受け取った key
  const [receivedKey, setReceivedKey] = useState<string | null>(null);
  useEffect(() => {
    listenRef.current = listen;
  });
  useEffect(() => {
    if (key === null) return;
    return listenRef.current((value) => {
      cache.set(key, value);
      setState({ key, value });
      setReceivedKey(key);
    });
  }, [key]);

  if (key === null) return { value: empty, loading: false, refreshing: false, fresh: false };
  if (state?.key === key && receivedKey === key) {
    return { value: state.value, loading: false, refreshing: false, fresh: true };
  }
  if (state?.key === key) return { value: state.value, loading: false, refreshing: false, fresh: false };
  if (cache.has(key)) return { value: cache.get(key) as T, loading: false, refreshing: false, fresh: false };
  // 届くまでは直前の値（なければ空）
  return state && keepPrevious
    ? { value: state.value, loading: false, refreshing: true, fresh: false }
    : { value: empty, loading: true, refreshing: false, fresh: false };
}

/** ログアウトしたときなどに、覚えている値を捨てる */
export const clearLiveCache = () => cache.clear();
