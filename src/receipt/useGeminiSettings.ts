import { useCallback, useSyncExternalStore } from "react";
import { load, save } from "../lib/storage";
import { DEFAULT_GEMINI_MODEL, GEMINI_MODELS } from "./gemini";

// API キーと最初に使うモデルは、端末にだけ保存する（家族とも共有しない）
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const notify = () => listeners.forEach((fn) => fn());

export function useGeminiSettings() {
  const apiKey = useSyncExternalStore(subscribe, () => load<string>("geminiApiKey", ""));
  const stored = useSyncExternalStore(subscribe, () => load<string>("geminiModel", DEFAULT_GEMINI_MODEL));
  // 一覧から外れた古いモデルは既定に戻す
  const model = GEMINI_MODELS.includes(stored) ? stored : DEFAULT_GEMINI_MODEL;
  const setApiKey = useCallback((v: string) => {
    save("geminiApiKey", v.trim());
    notify();
  }, []);
  const setModel = useCallback((v: string) => {
    save("geminiModel", v);
    notify();
  }, []);
  return { apiKey, model, setApiKey, setModel };
}
