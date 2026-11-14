// 「きろく」で見ている月と、絞り込んでいるカテゴリー。
// 「あゆみ」の月を押したときに、その月の「きろく」を開けるよう、画面の外に持っておく。
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toMonthKey, type MonthKey } from "../lib/months";

/** 「特別費だけ」に絞る印（カテゴリーの名前とぶつからない値） */
export const SPECIAL = "\u0000special";

type View = {
  month: MonthKey;
  category: string | null;
  /** 月を替える（絞り込みは外す） */
  showMonth: (month: MonthKey) => void;
  setCategory: (category: string | null) => void;
};

const Ctx = createContext<View | null>(null);

export function RecordsViewProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [category, setCategory] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      month,
      category,
      showMonth: (m: MonthKey) => {
        setMonth(m);
        setCategory(null);
      },
      setCategory,
    }),
    [month, category],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRecordsView() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRecordsView は RecordsViewProvider の中で使う");
  return ctx;
}
