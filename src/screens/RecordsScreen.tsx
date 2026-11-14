// きろく：何にいくら使ったかを確かめる・直す画面。
//
// 何をどこに置くか
// - 月の切り替えとカテゴリーの絞り込みは、画面の上に固定する。一覧をどこまで下げても、
//   「いま何月の・何を見ているか」が見えていて、そのまま別の月やカテゴリーへ替えられる
//   （探す場所が決まっていればよい操作なので上側。「あゆみ」の月を押してもここが開く）
// - カテゴリーの札は、その月に使った額の多い順。押すとそのカテゴリーだけに絞れる。特別費があった月は、その札も並ぶ
// - スクロールするのは一覧だけ。行を押すと直せる（右端の › が押せる合図）
// - 月や絞り込みを替えたら一覧は一番上から。タブを行き来しただけなら、見ていた位置のまま
// - 月を替えたとき、新しい月が届くまでは前の月を薄くして残す（空の画面を一瞬はさまない）
import { useLayoutEffect, useMemo, useRef } from "react";
import { useExpensesInRange } from "../data/hooks";
import type { Expense } from "../data/types";
import { dayKey, formatDay, formatYen } from "../lib/format";
import { addMonths, monthRange, parseMonthKey, toMonthKey } from "../lib/months";
import { sumAmount, sumSpecial } from "../lib/savings";
import { Amount } from "../ui/Amount";
import { ExpenseRow } from "../ui/ExpenseRow";
import { Icon } from "../ui/Icon";
import { SPECIAL, useRecordsView } from "./recordsView";

export function RecordsScreen() {
  const { month, category: picked, showMonth, setCategory } = useRecordsView();
  const { year, month: m } = parseMonthKey(month);
  const { start, end } = monthRange(year, m);
  const { expenses, loading, refreshing } = useExpensesInRange(start, end);
  const isCurrent = month >= toMonthKey(new Date());

  // カテゴリーごとの合計（多い順）
  const categories = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);
  const special = sumSpecial(expenses);
  // 選んでいた絞り込みがこの月に無ければ、絞り込まない
  const category =
    picked === SPECIAL
      ? special > 0
        ? SPECIAL
        : null
      : picked && categories.some(([c]) => c === picked)
        ? picked
        : null;

  const days = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    for (const e of expenses) {
      if (category === SPECIAL ? !e.isSpecial : category && e.category !== category) continue;
      const key = dayKey(new Date(e.date));
      groups.set(key, [...(groups.get(key) ?? []), e]);
    }
    return [...groups.entries()];
  }, [expenses, category]);

  // 月や絞り込みを替えたら、一覧を一番上から
  const list = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) first.current = false;
    else list.current?.scrollTo({ top: 0 });
  }, [month, category]);

  return (
    <div className="page records">
      <div className="records-head">
        <div className="monthbar">
          <h2 className="monthbar-label">
            {year}年{m}月
          </h2>
          <button
            className="fk-icon-button"
            aria-label="前の月"
            onClick={() => showMonth(addMonths(month, -1))}
          >
            <Icon name="back" />
          </button>
          <button
            className="fk-icon-button"
            aria-label="次の月"
            disabled={isCurrent}
            onClick={() => showMonth(addMonths(month, 1))}
          >
            <Icon name="forward" />
          </button>
        </div>

        <div className="chips chips--scroll fk-scroll" role="group" aria-label="絞り込む">
          <button className="chip" aria-pressed={category === null} onClick={() => setCategory(null)}>
            すべて
            <Amount value={sumAmount(expenses)} loading={loading} className="chip-value" />
          </button>
          {categories.map(([c, total]) => (
            <button
              key={c}
              className="chip"
              aria-pressed={category === c}
              onClick={() => setCategory(category === c ? null : c)}
            >
              {c}
              <span className="chip-value">{formatYen(total)}</span>
            </button>
          ))}
          {special > 0 && (
            <button
              className="chip"
              aria-pressed={category === SPECIAL}
              onClick={() => setCategory(category === SPECIAL ? null : SPECIAL)}
            >
              特別費
              <span className="chip-value">{formatYen(special)}</span>
            </button>
          )}
        </div>
      </div>

      <div ref={list} className="records-list fk-scroll" data-scroll-top>
        <div className={refreshing ? "days is-refreshing" : "days"}>
          {days.map(([key, items]) => (
            <section key={key} className="day">
              <div className="day-head">
                <h3 className="day-title">{formatDay(key)}</h3>
                <span className="day-total">{formatYen(sumAmount(items))}</span>
              </div>
              <ul className="expenses">
                {items.map((e) => (
                  <ExpenseRow key={e.id} expense={e} />
                ))}
              </ul>
            </section>
          ))}
          {!loading && days.length === 0 && <p className="quiet">この月の記録はありません</p>}
        </div>
      </div>
    </div>
  );
}
