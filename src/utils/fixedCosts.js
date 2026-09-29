// 固定費まわりの共通ヘルパー
//
// 固定費は fixedCosts/{familyId}/{id} に「テンプレート」として保存し、
// 各月の支出として expenses/{familyId}/{固定キー} に自動計上する。
// キーを 固定費ID + 年月 から決定的に作ることで、家族の複数端末が
// 同時に計上処理を走らせても同じ場所を上書きするだけになり二重計上しない。

// 端末を長期間開かなかった場合でも、さかのぼって計上するのはこの月数まで
export const MAX_BACKFILL_MONTHS = 12;

// Date -> "YYYY-MM"
export const toMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

// "YYYY-MM" に n ヶ月加算した "YYYY-MM"
export const addMonths = (monthKey, n) => {
  const [y, m] = monthKey.split("-").map(Number);
  return toMonthKey(new Date(y, m - 1 + n, 1));
};

export const fixedExpenseKey = (fixedCostId, monthKey) => `fixed_${fixedCostId}_${monthKey}`;

// 支払日(1〜31)をその月の日数に丸めた日付(ISO文字列)。
// 月の範囲クエリがタイムゾーンでずれないよう正午にしておく。
export const fixedExpenseDate = (monthKey, dayOfMonth) => {
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(Math.max(Number(dayOfMonth) || 1, 1), lastDay);
  return new Date(y, m - 1, day, 12).toISOString();
};

export const buildFixedExpense = (fixedCost, monthKey, userId) => ({
  amount: Number(fixedCost.amount) || 0,
  category: fixedCost.category,
  description: fixedCost.name,
  date: fixedExpenseDate(monthKey, fixedCost.dayOfMonth),
  userId: userId || fixedCost.createdBy || null,
  isFixed: true,
  fixedCostId: fixedCost.id,
});

// まだ計上していない月の一覧 (古い順)。
// lastGeneratedMonth が無い場合は今月分のみ対象とする。
export const pendingMonths = (lastGeneratedMonth, currentMonthKey) => {
  const oldest = addMonths(currentMonthKey, -(MAX_BACKFILL_MONTHS - 1));
  let key = lastGeneratedMonth ? addMonths(lastGeneratedMonth, 1) : currentMonthKey;
  if (key < oldest) key = oldest;

  const months = [];
  while (key <= currentMonthKey) {
    months.push(key);
    key = addMonths(key, 1);
  }
  return months;
};
