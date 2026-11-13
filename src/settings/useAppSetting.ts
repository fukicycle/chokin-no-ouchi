import { useCallback, useSyncExternalStore } from "react";
import config from "../../app.config";
import { load, save } from "../lib/storage";

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/**
 * app.config.ts の settings に書いた項目の値を読む・変える。
 * 例：const [unit] = useAppSetting<string>("unit");
 */
export function useAppSetting<T extends boolean | string>(id: string) {
  const def = config.settings.find((s) => s.id === id);
  if (!def) throw new Error(`app.config.ts の settings に "${id}" がありません`);
  const value = useSyncExternalStore(subscribe, () => load<T>(`setting:${id}`, def.default as T));
  const set = useCallback(
    (next: T) => {
      save(`setting:${id}`, next);
      listeners.forEach((fn) => fn());
    },
    [id],
  );
  return [value, set] as const;
}
