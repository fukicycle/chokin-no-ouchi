import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "geminiApiKey";

// BYOK: APIキーは端末のlocalStorageにのみ保存し、Firebaseなどには送信しない
export const useGeminiApiKey = () => {
  const [apiKey, setApiKeyState] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setApiKeyState(stored);
    } catch {
      // プライベートブラウジング等でlocalStorageが使えない場合は無視
    }
  }, []);

  const setApiKey = useCallback((value) => {
    setApiKeyState(value);
    try {
      if (value) {
        window.localStorage.setItem(STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  return { apiKey, setApiKey, hasApiKey: Boolean(apiKey) };
};
