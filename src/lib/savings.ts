// 貯金の計算（先取り貯金）。
//
// 月の手取り（income）から、先に貯めたい額（goal）を取り分ける。残りが「使えるお金」。
//   使えるお金 = 手取り − 貯めたい額
//   その月に貯まった額 = 手取り − 使った額（使えるお金が余れば目標より多く、使いすぎれば少なくなる）
//
// 特別費（isSpecial。車検・結婚式など）は、ふだんの暮らしの外の出費なので
//   ・「使えるお金」「今日あといくら」「その月の貯金が守れたか」には数えない（入れると、その月の数字が意味をなさなくなる）
//   ・これまでに貯まったお金からは引く（実際に手元から出ていったお金なので、ここは正直に減らす）
//
// 計画は budgets/{familyId}/plans/{YYYY-MM} に「その月から有効」として残す。
// 手取りや目標を変えても、前の月までの結果は変わらない。いちばん古い計画の月から数え始める。
import type { Expense } from "../data/types";
import { addMonths, daysInMonth, parseMonthKey, toMonthKey, type MonthKey } from "./months";
import { dayKey } from "./format";

export type Plan = { income: number; goal: number };
export type Plans = Record<MonthKey, Plan>;

/** 数え始めの月（いちばん古い計画）。計画がなければ null */
export const startMonth = (plans: Plans): MonthKey | null => Object.keys(plans).sort()[0] ?? null;

/** その月に有効な計画（その月以前でいちばん新しいもの）。数え始めより前の月は null */
export const planFor = (plans: Plans, month: MonthKey): Plan | null => {
  const key = Object.keys(plans)
    .filter((k) => k <= month)
    .sort()
    .pop();
  return key ? plans[key] : null;
};

export const budgetOf = (plan: Plan) => Math.max(0, plan.income - plan.goal);

export type MonthResult = {
  /** 使えるお金 */
  budget: number;
  spent: number;
  /** 使えるお金の残り（使いすぎたら 0） */
  left: number;
  /** 貯金に食い込んだ額（使えるお金をこえた分） */
  over: number;
  /** 貯まった額（月の途中なら、いま守れている額）。使えるお金の残りは含めない */
  kept: number;
  /** 月を締めたときに貯まる額 = 手取り − 使った額 */
  saved: number;
};

export const monthResult = (plan: Plan, spent: number): MonthResult => {
  const budget = budgetOf(plan);
  const over = Math.max(0, spent - budget);
  return {
    budget,
    spent,
    left: Math.max(0, budget - spent),
    over,
    kept: plan.goal - over,
    saved: plan.income - spent,
  };
};

export const sumAmount = (expenses: Pick<Expense, "amount">[]) =>
  expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

type Flagged = Pick<Expense, "amount" | "isSpecial">;
/** ふだんの支出の合計（特別費を除く） */
export const sumNormal = (expenses: Flagged[]) => sumAmount(expenses.filter((e) => !e.isSpecial));
/** 特別費の合計 */
export const sumSpecial = (expenses: Flagged[]) => sumAmount(expenses.filter((e) => e.isSpecial));

export type TodayAllowance = {
  /** 月末までの日数（今日を含む） */
  daysLeft: number;
  /** 今日使える額（今朝の時点の残りを、残りの日数で割ったもの） */
  perDay: number;
  /** 今日すでに使った額（固定費は含めない） */
  spentToday: number;
  /** 今日あと使える額（こえたら 0） */
  leftToday: number;
  /** 今日の分をこえた額 */
  overToday: number;
  /** 明日からの1日あたり（今日が月末なら null） */
  nextPerDay: number | null;
};

/**
 * 今日あといくら使えるか。
 * 固定費は月の初めにその月の分がすべて記録されるので、残りはふだんの支出だけで分ければよい。
 */
export const todayAllowance = (
  budget: number,
  allMonthExpenses: Pick<Expense, "amount" | "date" | "isFixed" | "isSpecial">[],
  today = new Date(),
): TodayAllowance => {
  const monthExpenses = allMonthExpenses.filter((e) => !e.isSpecial);
  const key = dayKey(today);
  const daysLeft = daysInMonth(today.getFullYear(), today.getMonth() + 1) - today.getDate() + 1;
  const spent = sumAmount(monthExpenses);
  const spentToday = sumAmount(monthExpenses.filter((e) => !e.isFixed && dayKey(new Date(e.date)) === key));
  // 今朝の時点の残り
  const leftThisMorning = Math.max(0, budget - (spent - spentToday));
  const perDay = Math.floor(leftThisMorning / daysLeft);
  const leftNow = Math.max(0, budget - spent);
  return {
    daysLeft,
    perDay,
    spentToday,
    leftToday: Math.max(0, perDay - spentToday),
    overToday: Math.max(0, spentToday - perDay),
    nextPerDay: daysLeft > 1 ? Math.floor(leftNow / (daysLeft - 1)) : null,
  };
};

export type JourneyMonth = {
  month: MonthKey;
  plan: Plan;
  /** ふだんの支出での結果（特別費は数えない） */
  result: MonthResult;
  /** その月の特別費 */
  special: number;
  /** 締まった月（先月まで） */
  closed: boolean;
};

type Dated = Pick<Expense, "amount" | "date" | "isSpecial">;

const byMonth = (expenses: Dated[]) => {
  const normal = new Map<MonthKey, number>();
  const special = new Map<MonthKey, number>();
  for (const e of expenses) {
    const m = toMonthKey(new Date(e.date));
    const into = e.isSpecial ? special : normal;
    into.set(m, (into.get(m) ?? 0) + (Number(e.amount) || 0));
  }
  return { normal, special };
};

/** 数え始めの月から今月までの、月ごとの結果（新しい順） */
export const journey = (plans: Plans, expenses: Dated[], today = new Date()): JourneyMonth[] => {
  const first = startMonth(plans);
  if (!first) return [];
  const { normal, special } = byMonth(expenses);
  const current = toMonthKey(today);
  const months: JourneyMonth[] = [];
  for (let m = first; m <= current; m = addMonths(m, 1)) {
    const plan = planFor(plans, m)!;
    months.push({
      month: m,
      plan,
      result: monthResult(plan, normal.get(m) ?? 0),
      special: special.get(m) ?? 0,
      closed: m < current,
    });
  }
  return months.reverse();
};

/** これまでに貯まった額（締まった月だけ）。特別費は、出た分だけ引く */
export const totalSaved = (months: JourneyMonth[]) =>
  months.filter((m) => m.closed).reduce((s, m) => s + m.result.saved - m.special, 0);

/** これまでの特別費（締まった月だけ） */
export const totalSpecial = (months: JourneyMonth[]) =>
  months.filter((m) => m.closed).reduce((s, m) => s + m.special, 0);

export type TrendMonth = { month: MonthKey; normal: number; special: number };

/** 使ったお金の推移。今月までの count ヶ月（古い順）。計画を立てる前の月も含む */
export const spendingTrend = (expenses: Dated[], count = 12, today = new Date()): TrendMonth[] => {
  const { normal, special } = byMonth(expenses);
  const current = toMonthKey(today);
  return Array.from({ length: count }, (_, i) => {
    const month = addMonths(current, i - (count - 1));
    return { month, normal: normal.get(month) ?? 0, special: special.get(month) ?? 0 };
  });
};

export const monthStart = (month: MonthKey) => {
  const { year, month: m } = parseMonthKey(month);
  return new Date(year, m - 1, 1);
};
