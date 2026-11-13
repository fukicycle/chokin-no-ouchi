// いま見ている期間（月か年）。ホーム・分析・履歴で共有する。
import { createContext, useContext, useState, type ReactNode } from "react";
import { monthRange } from "../lib/months";

export type PeriodMode = "month" | "year";

type Period = {
  mode: PeriodMode;
  year: number;
  month: number;
  /** 期間の初め・終わり */
  start: Date;
  end: Date;
  /** 「2026年9月」「2026年」 */
  label: string;
  /** 「今月」「今年」（今の期間でなければ「この月」「この年」） */
  noun: string;
  isCurrent: boolean;
  canGoNext: boolean;
  setMode: (m: PeriodMode) => void;
  prev: () => void;
  next: () => void;
};

const Ctx = createContext<Period | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const today = new Date();
  const [mode, setMode] = useState<PeriodMode>("month");
  const [ym, setYm] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });

  const value: Period = (() => {
    const now = new Date();
    const { year, month } = ym;
    const isCurrent =
      mode === "month"
        ? year === now.getFullYear() && month === now.getMonth() + 1
        : year === now.getFullYear();
    const range =
      mode === "month"
        ? monthRange(year, month)
        : { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
    const step = (n: number) =>
      setYm(({ year: y, month: m }) => {
        const d = mode === "month" ? new Date(y, m - 1 + n, 1) : new Date(y + n, m - 1, 1);
        return { year: d.getFullYear(), month: d.getMonth() + 1 };
      });
    return {
      mode,
      year,
      month,
      ...range,
      label: mode === "month" ? `${year}年${month}月` : `${year}年`,
      noun: mode === "month" ? (isCurrent ? "今月" : "この月") : isCurrent ? "今年" : "この年",
      isCurrent,
      canGoNext: !isCurrent,
      setMode,
      prev: () => step(-1),
      next: () => step(1),
    };
  })();

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePeriod() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePeriod は PeriodProvider の中で使う");
  return ctx;
}
