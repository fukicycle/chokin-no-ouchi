import { useCallback, useEffect, useState } from "react";
import { DEFAULT_GEMINI_MODEL, GEMINI_MODELS } from "../services/geminiReceipt";

const STORAGE_KEY = "geminiModel";

// レシート読み取りで最初に試すモデル。APIキーと同様に端末のlocalStorageにのみ保存する
export const useGeminiModel = () => {
  const [model, setModelState] = useState(DEFAULT_GEMINI_MODEL);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // モデル一覧から外れた古い設定は無視してデフォルトに戻す
      if (stored && GEMINI_MODELS.includes(stored)) setModelState(stored);
    } catch {
      // プライベートブラウジング等でlocalStorageが使えない場合は無視
    }
  }, []);

  const setModel = useCallback((value) => {
    setModelState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }, []);

  return { model, setModel };
};
