// 分析カード間で共有する集計ヘルパー

export const sumAmount = (expenses) => expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

export const sumFixed = (expenses) =>
  expenses.reduce((sum, e) => sum + (e.isFixed ? e.amount || 0 : 0), 0);

// 月の経過状況。進行中の月なら今日までの日数、過去の月なら月の日数すべて
export const monthProgress = (year, month, today = new Date()) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const isFuture = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1);
  const daysElapsed = isFuture ? 0 : isCurrentMonth ? today.getDate() : daysInMonth;
  return { daysInMonth, daysElapsed, inProgress: isCurrentMonth && daysElapsed < daysInMonth };
};

// 進行中の月の着地予測。固定費は月初にまとめて計上されるため日割りで伸ばさず、
// 変動費だけを今日までのペースで月末まで伸ばす。
export const projectMonthTotal = (total, fixedTotal, year, month, today = new Date()) => {
  const { daysInMonth, daysElapsed, inProgress } = monthProgress(year, month, today);
  if (!inProgress || daysElapsed === 0) return null;
  const variable = Math.max(0, total - fixedTotal);
  return fixedTotal + (variable / daysElapsed) * daysInMonth;
};

// "YYYY-MM" ごとの合計
export const totalsByMonth = (expenses) =>
  expenses.reduce((acc, e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] || 0) + (e.amount || 0);
    return acc;
  }, {});

// グラフの軸ラベル用。桁が大きいと見切れるので1万円以上は「万」で表す
export const formatYenAxis = (value) => {
  if (value >= 10000) return `${Math.round((value / 10000) * 10) / 10}万`;
  return value.toLocaleString();
};
