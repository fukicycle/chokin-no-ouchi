// 履歴：期間の支出を日ごとにまとめて並べる。絞り込み（カテゴリー）と並び替えは一覧の上。
import { useMemo, useState } from "react";
import { ExpenseDetailSheet } from "../expenses/ExpenseDetailSheet";
import { AddExpenseButton } from "../expenses/AddExpenseButton";
import { useExpensesInRange } from "../data/hooks";
import { usePeriod } from "../data/period";
import type { Expense } from "../data/types";
import { dayKey, formatYen, sumAmount, totalsByCategory } from "../lib/analytics";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonLines } from "../ui/Skeleton";
import { Choice } from "../ui/List";
import { PeriodBar } from "../ui/PeriodBar";
import { useHistoryFilter } from "./historyFilter";

const dayFmt = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });

export function ExpenseRow({
  expense,
  onOpen,
  showDate,
}: {
  expense: Expense;
  onOpen: (e: Expense) => void;
  showDate?: boolean;
}) {
  return (
    <li>
      <button className="expense-row" onClick={() => onOpen(expense)}>
        <span className="expense-main">
          <span className="expense-category">
            {expense.category}
            {expense.isFixed && <span className="tag">固定費</span>}
          </span>
          {(expense.description || showDate) && (
            <span className="expense-desc">
              {showDate && dayFmt.format(new Date(expense.date))}
              {showDate && expense.description && "・"}
              {expense.description}
            </span>
          )}
        </span>
        <span className="expense-amount">{formatYen(expense.amount)}</span>
      </button>
    </li>
  );
}

export function HistoryScreen() {
  const period = usePeriod();
  const { expenses, loading, refreshing } = useExpensesInRange(period.start, period.end);
  const { category, setCategory } = useHistoryFilter();
  const [sort, setSort] = useState<"date" | "amount">("date");
  const [selected, setSelected] = useState<Expense | null>(null);

  const categories = useMemo(() => totalsByCategory(expenses).map((c) => c.category), [expenses]);
  const filtered = category ? expenses.filter((e) => e.category === category) : expenses;

  // 日付順は日ごとにまとめる（見出しにその日の合計）。金額順はまとめずに並べる
  const groups = useMemo(() => {
    if (sort === "amount") return null;
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const k = dayKey(new Date(e.date));
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.values()];
  }, [filtered, sort]);

  return (
    <div className={refreshing ? "page is-refreshing" : "page"}>
      <PeriodBar />

      {expenses.length > 0 && (
        <div className="filters">
          <div className="chips chips--scroll" role="group" aria-label="カテゴリーで絞り込む">
            <button className="chip" aria-pressed={category === null} onClick={() => setCategory(null)}>
              すべて
            </button>
            {categories.map((c) => (
              <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="filters-row">
            <span className="filters-total">
              {category ? `${category}・` : ""}
              {filtered.length}件 {formatYen(sumAmount(filtered))}
            </span>
            <Choice
              label="並び順"
              value={sort}
              options={[
                { value: "date", label: "日付順" },
                { value: "amount", label: "金額順" },
              ]}
              onChange={setSort}
            />
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonLines rows={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            category ? `${period.noun}の「${category}」はありません` : `${period.noun}の記録はまだありません`
          }
        >
          {category
            ? "上の［すべて］で絞り込みを外せます。"
            : "右下の［記録する］から、使ったお金を残せます。"}
        </EmptyState>
      ) : groups ? (
        groups.map((list) => (
          <section key={list[0].id} className="day">
            <h2 className="day-head">
              <span>{dayFmt.format(new Date(list[0].date))}</span>
              <span className="day-total">{formatYen(sumAmount(list))}</span>
            </h2>
            <ul className="expense-list">
              {list.map((e) => (
                <ExpenseRow key={e.id} expense={e} onOpen={setSelected} />
              ))}
            </ul>
          </section>
        ))
      ) : (
        <ul className="expense-list">
          {[...filtered]
            .sort((a, b) => b.amount - a.amount)
            .map((e) => (
              <ExpenseRow key={e.id} expense={e} onOpen={setSelected} showDate />
            ))}
        </ul>
      )}

      <AddExpenseButton />
      <ExpenseDetailSheet key={selected?.id} expense={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
