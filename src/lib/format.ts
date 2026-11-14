// 金額と日付の書き方をそろえる

export const formatYen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

/** マイナスは「−¥1,200」と書く（全角のマイナスで、ハイフンと見分けがつくように） */
export const formatSignedYen = (n: number) => (n < 0 ? `−${formatYen(-n)}` : formatYen(n));

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "YYYY-MM-DD"（端末の日付） */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** 「今日」「きのう」「11/12（木）」 */
export const formatDay = (key: string, today = new Date()) => {
  if (key === dayKey(today)) return "今日";
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  if (key === dayKey(y)) return "きのう";
  const [yy, m, d] = key.split("-").map(Number);
  return `${m}/${d}（${WEEKDAYS[new Date(yy, m - 1, d).getDay()]}）`;
};

/** 「2026年11月」。今年なら「11月」 */
export const formatMonth = (key: string, today = new Date()) => {
  const [y, m] = key.split("-").map(Number);
  return y === today.getFullYear() ? `${m}月` : `${y}年${m}月`;
};
