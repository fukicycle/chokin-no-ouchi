// 履歴の絞り込み。ホームのカテゴリーを押すと、そのカテゴリーで絞った履歴が開く。
import { createContext, useContext, useState, type ReactNode } from "react";

type Filter = { category: string | null; setCategory: (c: string | null) => void };
const Ctx = createContext<Filter | null>(null);

export function HistoryFilterProvider({ children }: { children: ReactNode }) {
  const [category, setCategory] = useState<string | null>(null);
  return <Ctx.Provider value={{ category, setCategory }}>{children}</Ctx.Provider>;
}

export function useHistoryFilter() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHistoryFilter は HistoryFilterProvider の中で使う");
  return ctx;
}
