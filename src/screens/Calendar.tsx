// 「きろく」の暦。紙の家計簿の月のページのように、日の升が溝で区切られて並ぶ。
//
// 升の見方
// - 升の下から満ちる薄墨：その日の「ふだんの支出」が、その日の分（ちょきんの「今日の分」と同じ数え方）に対してどれだけか。
//   満ちきった升は、その日の分をこえた日（金額も太くなる）
// - 日付の翡翠の輪：使わなかった日（過ぎた日で、ふだんの支出が 0）。紙の家計簿で丸をつけるのと同じ
// - 日付の墨の丸：今日
// - 右上の小さな印：固定費（塗った点）・特別費（輪郭だけの点。帯や棒と同じく、輪郭で「数えていない」ことを示す）
// - 選んでいる升は沈めて、文字を差し色にする（DESIGN.md 1-6）
//
// 段の数はその月に要るだけ（たいてい5段）。6段に固定すると、ほとんどの月で翌月の日だけの段が残り、
// 小さい iPhone では下の一覧が2行しか見えなくなるため。段の数は月で決まり、記録の届き方では変わらないので、
// 月を替えた瞬間に一度だけ決まる（読み込みの途中でガクンと動くことはない）。前後の月の日は薄く数字だけ
import type { CSSProperties } from "react";
import { formatYen } from "../lib/format";
import type { DayShare } from "../lib/savings";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 升に収まる短い金額：3,440 / 1.2万 / 12万 */
export const shortYen = (n: number) =>
  n >= 100000
    ? `${Math.round(n / 10000)}万`
    : n >= 10000
      ? `${Number((n / 10000).toFixed(1))}万`
      : n.toLocaleString("ja-JP");

/** 升の満ち具合（0〜1）。その日の分が無いとき（計画が無い）は、その月でいちばん使った日を 1 とする */
const fillOf = (d: DayShare, max: number) => {
  if (d.normal <= 0) return 0;
  const base = d.share ?? max;
  return base <= 0 ? 1 : Math.min(1, d.normal / base);
};

export function Calendar({
  year,
  month,
  days,
  selected,
  dimmed,
  loading,
  onPick,
}: {
  year: number;
  month: number;
  days: DayShare[];
  /** 選んでいる日（"YYYY-MM-DD"） */
  selected: string | null;
  /** カテゴリーで絞っているとき、そのカテゴリーの記録が無い日 */
  dimmed: Set<string> | null;
  loading: boolean;
  onPick: (key: string) => void;
}) {
  const lead = new Date(year, month - 1, 1).getDay();
  const prevDays = new Date(year, month - 1, 0).getDate();
  const max = Math.max(1, ...days.map((d) => d.normal));
  const rows = Math.ceil((lead + days.length) / 7);
  const cells = Array.from({ length: rows * 7 }, (_, i) => i - lead);
  const lastRow = (i: number) => i + lead >= (rows - 1) * 7;

  return (
    <div className="cal" role="group" aria-label={`${year}年${month}月の暦`}>
      <div className="cal-week" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((i) => {
          const d = days[i];
          if (!d) {
            // 前後の月の日：数字だけ薄く（押せない）
            const n = i < 0 ? prevDays + i + 1 : i - days.length + 1;
            return (
              <span
                key={i}
                className={lastRow(i) ? "cal-day cal-day--out is-lastrow" : "cal-day cal-day--out"}
                aria-hidden="true"
              >
                <span className="cal-num">{n}</span>
              </span>
            );
          }
          const quiet = !loading && d.when === "past" && d.normal === 0;
          const over = d.share !== null && d.normal > d.share;
          const cls = [
            "cal-day",
            `is-${d.when}`,
            quiet && "is-quiet",
            over && "is-over",
            dimmed?.has(d.key) && "is-dim",
            lastRow(i) && "is-lastrow",
          ]
            .filter(Boolean)
            .join(" ");
          const label = [
            `${month}月${d.day}日（${WEEKDAYS[(lead + d.day - 1) % 7]}）`,
            d.when === "today" && "今日",
            d.normal > 0 && `ふだん ${formatYen(d.normal)}`,
            over && "その日の分をこえた",
            quiet && "使わなかった日",
            d.fixed > 0 && `固定費 ${formatYen(d.fixed)}`,
            d.special > 0 && `特別費 ${formatYen(d.special)}`,
          ]
            .filter(Boolean)
            .join("、");
          return (
            <button
              key={d.key}
              className={cls}
              aria-pressed={selected === d.key}
              aria-label={label}
              style={{ "--fill": loading ? 0 : fillOf(d, max) } as CSSProperties}
              onClick={() => onPick(d.key)}
            >
              <span className="cal-num">{d.day}</span>
              {(d.fixed > 0 || d.special > 0) && (
                <span className="cal-marks" aria-hidden="true">
                  {d.fixed > 0 && <i className="cal-mark cal-mark--fixed" />}
                  {d.special > 0 && <i className="cal-mark cal-mark--special" />}
                </span>
              )}
              <span className="cal-amount" aria-hidden="true">
                {!loading && d.normal > 0 ? shortYen(d.normal) : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
