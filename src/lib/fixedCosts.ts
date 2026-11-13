// 固定費を各月の支出として計上するための計算。
//
// 固定費は fixedCosts/{familyId}/{id} にひな形として保存し、各月の支出として
// expenses/{familyId}/{固定費ID_年月} に計上する。キーを固定費ID と年月から決めるので、
// 家族の複数の端末が同時に計上しても同じ場所を上書きするだけで、二重に計上されない。
import type { ExpenseInput, FixedCost } from "../data/types";
import { addMonths, parseMonthKey, type MonthKey } from "./months";

/** しばらくアプリを開かなかったとき、さかのぼって計上するのはこの月数まで */
export const MAX_BACKFILL_MONTHS = 12;

export const fixedExpenseKey = (fixedCostId: string, month: MonthKey) => `fixed_${fixedCostId}_${month}`;

/** 支払日をその月の日数に丸めた日付。月の範囲の検索がずれないよう正午にする */
export const fixedExpenseDate = (month: MonthKey, dayOfMonth: number) => {
  const { year, month: m } = parseMonthKey(month);
  const last = new Date(year, m, 0).getDate();
  const day = Math.min(Math.max(Math.round(dayOfMonth) || 1, 1), last);
  return new Date(year, m - 1, day, 12).toISOString();
};

export const buildFixedExpense = (
  fixedCost: Pick<FixedCost, "id" | "name" | "category" | "amount" | "dayOfMonth" | "createdBy">,
  month: MonthKey,
  userId?: string | null,
): ExpenseInput => ({
  amount: Number(fixedCost.amount) || 0,
  category: fixedCost.category,
  description: fixedCost.name,
  date: fixedExpenseDate(month, fixedCost.dayOfMonth),
  userId: userId ?? fixedCost.createdBy ?? null,
  isFixed: true,
  fixedCostId: fixedCost.id,
});

/** まだ計上していない月（古い順）。lastGeneratedMonth が無いときは今月だけ */
export const pendingMonths = (lastGeneratedMonth: MonthKey | undefined, current: MonthKey): MonthKey[] => {
  const oldest = addMonths(current, -(MAX_BACKFILL_MONTHS - 1));
  let key = lastGeneratedMonth ? addMonths(lastGeneratedMonth, 1) : current;
  if (key < oldest) key = oldest;
  const months: MonthKey[] = [];
  while (key <= current) {
    months.push(key);
    key = addMonths(key, 1);
  }
  return months;
};
