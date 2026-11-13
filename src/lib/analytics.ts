// 支出の集計。画面から切り離した計算だけを置き、テストする。
import type { Expense } from "../data/types";
import { monthProgress, toMonthKey, type MonthKey } from "./months";

type Amounted = Pick<Expense, "amount" | "isFixed">;

const yen = new Intl.NumberFormat("ja-JP");
export const formatYen = (n: number) => `¥${yen.format(Math.round(n))}`;

/** グラフの軸。桁が大きいと見切れるので1万円以上は「万」で表す */
export const formatYenAxis = (n: number) =>
  n >= 10000 ? `${Math.round((n / 10000) * 10) / 10}万` : yen.format(n);

export const sumAmount = (list: Amounted[]) => list.reduce((s, e) => s + (e.amount || 0), 0);
export const sumFixed = (list: Amounted[]) => list.reduce((s, e) => s + (e.isFixed ? e.amount || 0 : 0), 0);

/** カテゴリーごとの合計（多い順） */
export const totalsByCategory = (list: Pick<Expense, "amount" | "category">[]) => {
  const map = new Map<string, number>();
  for (const e of list) map.set(e.category, (map.get(e.category) ?? 0) + (e.amount || 0));
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
};

/** "YYYY-MM" ごとの合計 */
export const totalsByMonth = (list: Pick<Expense, "amount" | "date">[]) => {
  const map: Record<MonthKey, number> = {};
  for (const e of list) {
    const key = toMonthKey(new Date(e.date));
    map[key] = (map[key] ?? 0) + (e.amount || 0);
  }
  return map;
};

/**
 * 進行中の月の着地予測。固定費は月初にまとめて計上されるので日割りで伸ばさず、
 * 変動費だけを今日までのペースで月末まで伸ばす。進行中でなければ null
 */
export const projectMonthTotal = (
  total: number,
  fixedTotal: number,
  year: number,
  month: number,
  today = new Date(),
) => {
  const { days, elapsed, inProgress } = monthProgress(year, month, today);
  if (!inProgress || elapsed === 0) return null;
  const variable = Math.max(0, total - fixedTotal);
  return fixedTotal + (variable / elapsed) * days;
};

/** 今月の残り日数（今日を含む）で予算に収めるための、1日あたりの上限。今月でなければ null */
export const dailyAllowance = (
  budget: number,
  total: number,
  year: number,
  month: number,
  today = new Date(),
) => {
  if (!budget) return null;
  const { days, inProgress } = monthProgress(year, month, today);
  const isThisMonth = toMonthKey(today) === `${year}-${String(month).padStart(2, "0")}`;
  if (!isThisMonth && !inProgress) return null;
  const remainingDays = days - today.getDate() + 1;
  const remaining = budget - total;
  return { remainingDays, remaining, perDay: remaining > 0 ? remaining / remainingDays : 0 };
};

/** 支出のあった月だけで平均する（使い始めの月や記録していない月で平均が下がらないように） */
export const averageOfMonths = (months: MonthKey[], totals: Record<MonthKey, number>) => {
  const values = months.map((m) => totals[m] ?? 0).filter((v) => v > 0);
  if (values.length === 0) return null;
  return { value: values.reduce((a, b) => a + b, 0) / values.length, months: values.length };
};

export type CategoryMove = {
  category: string;
  current: number;
  previous: number;
  diff: number;
  /** 前の期間に無かったカテゴリーは null */
  percent: number | null;
};

/** カテゴリーごとの増減。増えた順・減った順にそれぞれ上位 limit 件 */
export const categoryMoves = (
  current: Pick<Expense, "amount" | "category">[],
  previous: Pick<Expense, "amount" | "category">[],
  limit = 3,
) => {
  const cur = new Map(totalsByCategory(current).map((c) => [c.category, c.amount]));
  const prev = new Map(totalsByCategory(previous).map((c) => [c.category, c.amount]));
  const all: CategoryMove[] = [...new Set([...cur.keys(), ...prev.keys()])].map((category) => {
    const c = cur.get(category) ?? 0;
    const p = prev.get(category) ?? 0;
    return { category, current: c, previous: p, diff: c - p, percent: p > 0 ? ((c - p) / p) * 100 : null };
  });
  return {
    increases: all
      .filter((m) => m.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, limit),
    decreases: all
      .filter((m) => m.diff < 0)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, limit),
  };
};

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/**
 * 日ごと・曜日ごとの支出（変動費のみ）。固定費は支払日が決まっていて特定の日だけが突出するので除く。
 * 期間は [start, end] のうち今日までの日。
 */
export const spendingPattern = (list: Expense[], start: Date, end: Date, today = new Date()) => {
  const byDay = new Map<string, { total: number; items: Expense[] }>();
  for (const e of list) {
    if (e.isFixed) continue;
    const key = dayKey(new Date(e.date));
    const day = byDay.get(key) ?? { total: 0, items: [] };
    day.total += e.amount || 0;
    day.items.push(e);
    byDay.set(key, day);
  }

  const last = end < today ? end : today;
  const sum = Array(7).fill(0) as number[];
  const count = Array(7).fill(0) as number[];
  let noSpendDays = 0;
  let elapsedDays = 0;
  let peak: { date: Date; total: number } | null = null;
  for (let d = new Date(start); d <= last; d.setDate(d.getDate() + 1)) {
    const total = byDay.get(dayKey(d))?.total ?? 0;
    sum[d.getDay()] += total;
    count[d.getDay()] += 1;
    elapsedDays += 1;
    if (total === 0) noSpendDays += 1;
    if (total > 0 && (!peak || total > peak.total)) peak = { date: new Date(d), total };
  }

  const weekdays = WEEKDAYS.map((name, i) => ({
    name,
    average: count[i] > 0 ? Math.round(sum[i] / count[i]) : 0,
  }));
  const top = weekdays.reduce((a, b) => (b.average > a.average ? b : a), weekdays[0]);
  const maxDaily = Math.max(0, ...[...byDay.values()].map((d) => d.total));

  return { byDay, weekdays, top, noSpendDays, elapsedDays, peak, maxDaily };
};
