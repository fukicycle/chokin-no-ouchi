import { useEffect, useRef, useState } from "react";

/**
 * Firebase の購読。key（何を見ているか）ごとに値を持ち、key が変わったら前の値は見せない。
 * key が null（ログイン前など）なら購読しない。
 */
export function useLive<T>(key: string | null, listen: (set: (v: T) => void) => () => void, empty: T) {
  const [state, setState] = useState<{ key: string; value: T } | null>(null);
  const listenRef = useRef(listen);
  useEffect(() => {
    listenRef.current = listen;
  });
  useEffect(() => {
    if (key === null) return;
    return listenRef.current((value) => setState({ key, value }));
  }, [key]);
  const fresh = state !== null && state.key === key;
  return { value: fresh ? state.value : empty, loading: key !== null && !fresh };
}
