// 家族のデータを購読するフック。すべて familyId の下を読む。
import {
  endAt,
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  startAt,
  update,
} from "firebase/database";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { database } from "../firebase/config";
import { buildFixedExpense, fixedExpenseKey, pendingMonths } from "../lib/fixedCosts";
import { addMonths, toMonthKey } from "../lib/months";
import type { Expense, FixedCost, FixedCostInput } from "./types";
import { useLive } from "./useLive";

const toList = <T>(data: Record<string, Omit<T, "id">> | null) =>
  data ? Object.entries(data).map(([id, v]) => ({ id, ...v }) as T) : [];

const EMPTY: never[] = [];

/** 期間 [start, end] の支出（新しい順） */
export function useExpensesInRange(start: Date, end: Date) {
  const { familyId } = useAuth();
  // Date は毎回作り直されるので、key には文字列を使う
  const from = start.toISOString();
  const to = end.toISOString();
  const { value, loading, refreshing } = useLive<Expense[]>(
    familyId ? `expenses|${familyId}|${from}|${to}` : null,
    (set) =>
      onValue(
        query(ref(database, `expenses/${familyId}`), orderByChild("date"), startAt(from), endAt(to)),
        (s) => set(toList<Expense>(s.val()).sort((a, b) => b.date.localeCompare(a.date))),
      ),
    EMPTY,
    // 月や年を送ったとき、新しい期間の支出が届くまで前の期間の表示を残す（画面を崩さない）
    { keepPrevious: true },
  );
  return { expenses: value, loading, refreshing };
}

/** これまでに使ったカテゴリー（入力の候補に出す） */
export function useCategories() {
  const { familyId } = useAuth();
  return useLive<string[]>(
    familyId ? `categories|${familyId}` : null,
    (set) => {
      const since = new Date();
      since.setFullYear(since.getFullYear() - 2);
      const q = query(
        ref(database, `expenses/${familyId}`),
        orderByChild("date"),
        startAt(since.toISOString()),
      );
      return onValue(q, (s) => {
        const counts = new Map<string, number>();
        for (const e of toList<Expense>(s.val())) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
        // よく使う順に並べる
        set([...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c));
      });
    },
    EMPTY,
  ).value;
}

/** 月間予算（家族で共有） */
export function useBudget() {
  const { familyId } = useAuth();
  const { value: monthlyBudget, loading: budgetLoading } = useLive<number>(
    familyId ? `budget|${familyId}` : null,
    (set) => onValue(ref(database, `budgets/${familyId}`), (s) => set(s.val()?.monthlyBudget || 0)),
    0,
  );
  const saveBudget = useCallback(
    async (amount: number) => {
      if (familyId) await update(ref(database, `budgets/${familyId}`), { monthlyBudget: amount });
    },
    [familyId],
  );
  return { monthlyBudget, saveBudget, loading: budgetLoading };
}

const normalizeFixed = (input: FixedCostInput) => ({
  name: input.name.trim(),
  category: input.category.trim(),
  amount: Number(input.amount) || 0,
  dayOfMonth: Math.min(Math.max(Math.round(Number(input.dayOfMonth)) || 1, 1), 31),
});

/** 毎月の固定費のひな形と、その追加・変更・削除 */
export function useFixedCosts() {
  const { familyId, user } = useAuth();
  const {
    value: fixedCosts,
    loading,
    fresh,
  } = useLive<FixedCost[]>(
    familyId ? `fixedCosts|${familyId}` : null,
    (set) =>
      onValue(ref(database, `fixedCosts/${familyId}`), (s) =>
        set(toList<FixedCost>(s.val()).sort((a, b) => a.dayOfMonth - b.dayOfMonth || b.amount - a.amount)),
      ),
    EMPTY,
  );

  /** includeThisMonth=false なら来月分から計上する */
  const add = useCallback(
    async (input: FixedCostInput, includeThisMonth: boolean) => {
      if (!familyId) return;
      const now = toMonthKey(new Date());
      await push(ref(database, `fixedCosts/${familyId}`), {
        ...normalizeFixed(input),
        createdBy: user?.uid ?? null,
        createdAt: new Date().toISOString(),
        // 自動計上は lastGeneratedMonth の翌月から
        lastGeneratedMonth: includeThisMonth ? addMonths(now, -1) : now,
      });
    },
    [familyId, user],
  );

  /** applyToThisMonth=true なら、計上済みの今月分の支出にも反映する */
  const change = useCallback(
    async (fixedCost: FixedCost, input: FixedCostInput, applyToThisMonth: boolean) => {
      if (!familyId) return;
      const values = normalizeFixed(input);
      const updates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) updates[`fixedCosts/${familyId}/${fixedCost.id}/${k}`] = v;
      if (applyToThisMonth) {
        const month = toMonthKey(new Date());
        const path = `expenses/${familyId}/${fixedExpenseKey(fixedCost.id, month)}`;
        // 消した支出を復活させないよう、あるときだけ変える
        if ((await get(ref(database, path))).exists()) {
          const next = buildFixedExpense({ ...fixedCost, ...values }, month, user?.uid);
          for (const k of ["amount", "category", "description", "date"] as const)
            updates[`${path}/${k}`] = next[k];
        }
      }
      await update(ref(database), updates);
    },
    [familyId, user],
  );

  /** ひな形だけ消す。計上済みの過去の支出は履歴に残す */
  const removeFixed = useCallback(
    async (id: string) => {
      if (familyId) await remove(ref(database, `fixedCosts/${familyId}/${id}`));
    },
    [familyId],
  );

  return { fixedCosts, loading, fresh, add, change, remove: removeFixed };
}

/**
 * 固定費を各月の支出として自動で計上する。アプリを開いたときと、
 * しばらく裏にあったアプリが前に出てきたとき（月をまたいだかもしれない）に確かめる。
 * 計上したら onGenerated に件数を知らせる（お知らせに出す）。
 */
export function useFixedCostSync(onGenerated?: (count: number, names: string[]) => void) {
  const { familyId, user } = useAuth();
  // 覚えていた古い一覧ではなく、いま届いた一覧で判断する（消した月を記録し直さないように）
  const { fixedCosts, fresh } = useFixedCosts();
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const running = useRef(false);
  const notify = useRef(onGenerated);
  useEffect(() => {
    notify.current = onGenerated;
  });

  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && setMonth(toMonthKey(new Date()));
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    if (!familyId || !fresh || running.current) return;
    const updates: Record<string, unknown> = {};
    const names: string[] = [];
    let count = 0;
    for (const f of fixedCosts) {
      const months = pendingMonths(f.lastGeneratedMonth, month);
      if (months.length === 0) continue;
      for (const m of months) {
        updates[`expenses/${familyId}/${fixedExpenseKey(f.id, m)}`] = buildFixedExpense(f, m, user?.uid);
        count += 1;
      }
      names.push(f.name);
      // 計上した月を残しておくと、ユーザーが消した月の支出をもう一度計上しない
      updates[`fixedCosts/${familyId}/${f.id}/lastGeneratedMonth`] = month;
    }
    if (count === 0) return;
    running.current = true;
    update(ref(database), updates)
      .then(() => notify.current?.(count, names))
      .catch((error) => console.error("固定費の自動計上に失敗しました", error))
      .finally(() => {
        running.current = false;
      });
  }, [familyId, user, fixedCosts, fresh, month]);
}
