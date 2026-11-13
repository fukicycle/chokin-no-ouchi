// 年月の扱い。月は "YYYY-MM" の文字列で持つ（文字列の大小がそのまま前後になる）

export type MonthKey = string;

export const toMonthKey = (date: Date): MonthKey =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const parseMonthKey = (key: MonthKey) => {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
};

/** "YYYY-MM" に n ヶ月足した "YYYY-MM" */
export const addMonths = (key: MonthKey, n: number): MonthKey => {
  const { year, month } = parseMonthKey(key);
  return toMonthKey(new Date(year, month - 1 + n, 1));
};

export const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

/** 月の初日 0:00 〜 末日 23:59:59.999 */
export const monthRange = (year: number, month: number) => ({
  start: new Date(year, month - 1, 1),
  end: new Date(year, month, 0, 23, 59, 59, 999),
});

/** 月の経過。進行中の月なら今日までの日数、過去の月なら全日数、先の月なら 0 */
export const monthProgress = (year: number, month: number, today = new Date()) => {
  const days = daysInMonth(year, month);
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const now = toMonthKey(today);
  const elapsed = key > now ? 0 : key === now ? today.getDate() : days;
  return { days, elapsed, inProgress: key === now && elapsed < days };
};
