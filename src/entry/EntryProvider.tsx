// 支出を記録する・直すシートを、どの画面からでも開けるようにする。
// 開くのは右下の［記録する］（新しい記録）と、一覧の行（その記録を直す）。
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Expense } from "../data/types";
import { EntrySheet } from "./EntrySheet";

type Ctx = { openNew: () => void; openEdit: (expense: Expense) => void };
const EntryContext = createContext<Ctx | null>(null);

export function EntryProvider({ children }: { children: ReactNode }) {
  // seq は開くたびに増やす（前に打ちかけた内容を持ち越さない）
  const [target, setTarget] = useState<{ seq: number; expense: Expense | null }>({ seq: 0, expense: null });
  const [open, setOpen] = useState(false);

  const openNew = useCallback(() => {
    setTarget((t) => ({ seq: t.seq + 1, expense: null }));
    setOpen(true);
  }, []);
  const openEdit = useCallback((expense: Expense) => {
    setTarget((t) => ({ seq: t.seq + 1, expense }));
    setOpen(true);
  }, []);
  const value = useMemo(() => ({ openNew, openEdit }), [openNew, openEdit]);

  return (
    <EntryContext.Provider value={value}>
      {children}
      <EntrySheet key={target.seq} open={open} expense={target.expense} onClose={() => setOpen(false)} />
    </EntryContext.Provider>
  );
}

export function useEntry() {
  const ctx = useContext(EntryContext);
  if (!ctx) throw new Error("useEntry は EntryProvider の中で使う");
  return ctx;
}
