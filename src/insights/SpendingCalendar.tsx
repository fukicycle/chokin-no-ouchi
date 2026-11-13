// 日別のカレンダー。使った額が多い日ほど差し色が濃い（1色の濃淡）。日付を押すとその日の内訳。
import { useState } from "react";
import type { Expense } from "../data/types";
import { dayKey, formatYen, WEEKDAYS } from "../lib/analytics";

const LEVELS = 4;

export function SpendingCalendar({
  year,
  month,
  byDay,
  maxDaily,
  peak,
}: {
  year: number;
  month: number;
  byDay: Map<string, { total: number; items: Expense[] }>;
  maxDaily: number;
  peak: { date: Date; total: number } | null;
}) {
  const [selected, setSelected] = useState<Date | null>(null);
  const today = new Date();
  const leading = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: days }, (_, i) => new Date(year, month - 1, i + 1)),
  ];
  const level = (total: number) =>
    total && maxDaily ? Math.min(LEVELS, Math.ceil((total / maxDaily) * LEVELS)) : 0;
  const sel = selected ? byDay.get(dayKey(selected)) : undefined;

  return (
    <div className="calendar">
      <div className="calendar-grid" role="grid" aria-label="日別の支出">
        {WEEKDAYS.map((w) => (
          <span key={w} className="calendar-weekday">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const total = byDay.get(dayKey(d))?.total ?? 0;
          const future = d > today;
          const isSel = selected ? dayKey(selected) === dayKey(d) : false;
          return (
            <button
              key={d.getDate()}
              className={`calendar-day lv${future ? "-future" : level(total)}`}
              aria-pressed={isSel}
              aria-label={`${month}月${d.getDate()}日 ${formatYen(total)}`}
              disabled={future}
              onClick={() => setSelected(isSel ? null : d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="calendar-scale" aria-hidden="true">
        少
        {Array.from({ length: LEVELS + 1 }, (_, i) => (
          <span key={i} className={`calendar-swatch lv${i}`} />
        ))}
        多
      </div>
      <div className="calendar-detail">
        {selected ? (
          <>
            <p className="calendar-detail-head">
              <span>
                {month}月{selected.getDate()}日（{WEEKDAYS[selected.getDay()]}）
              </span>
              <span className="num">{formatYen(sel?.total ?? 0)}</span>
            </p>
            {sel ? (
              <ul className="calendar-items">
                {sel.items.map((e) => (
                  <li key={e.id}>
                    <span>
                      {e.category}
                      {e.description ? `・${e.description}` : ""}
                    </span>
                    <span className="num">{formatYen(e.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">この日は使っていません。</p>
            )}
          </>
        ) : (
          <p className="hint">
            {peak
              ? `いちばん使った日は ${month}月${peak.date.getDate()}日（${formatYen(peak.total)}）。`
              : ""}
            日付を押すと内訳が見られます。
          </p>
        )}
      </div>
    </div>
  );
}
