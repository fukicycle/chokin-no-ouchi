// 「きろく」で見ている月と、暦で選んでいるもの（日かカテゴリー）。
// 画面の外に持っておくのは、
// - 「あゆみ」の月を押したときに、その月の「きろく」を開けるように
// - 日を選んでいる間、右下の［記録する］を「その日に記録」にできるように（AppShell が読む）
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toMonthKey, type MonthKey } from "../lib/months";

/** 「特別費だけ」に絞る印（カテゴリーの名前とぶつからない値） */
export const SPECIAL = "\u0000special";

/** 暦で選んでいるもの。何も選んでいなければ、その月のまとめを出す */
export type Focus = { kind: "day"; key: string } | { kind: "category"; name: string } | null;

type View = {
  month: MonthKey;
  focus: Focus;
  /** 月を替える（選んでいたものは外す） */
  showMonth: (month: MonthKey) => void;
  setFocus: (focus: Focus) => void;
};

const Ctx = createContext<View | null>(null);

export function RecordsViewProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [focus, setFocus] = useState<Focus>(null);
  const value = useMemo(
    () => ({
      month,
      focus,
      showMonth: (m: MonthKey) => {
        setMonth(m);
        setFocus(null);
      },
      setFocus,
    }),
    [month, focus],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRecordsView() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRecordsView は RecordsViewProvider の中で使う");
  return ctx;
}
