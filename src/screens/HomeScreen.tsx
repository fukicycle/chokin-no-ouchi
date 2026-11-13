// ホーム：「今月いくら使ったか」と「あといくら使えるか」をひと目で。
// 数字（合計）を一番大きく、その下に予算の受け皿、カテゴリーの内訳、最近の支出の順。
import { useState } from "react";
import { useNavigate } from "react-router";
import { AddExpenseButton } from "../expenses/AddExpenseButton";
import { ExpenseDetailSheet } from "../expenses/ExpenseDetailSheet";
import { useBudget, useExpensesInRange } from "../data/hooks";
import { usePeriod } from "../data/period";
import type { Expense } from "../data/types";
import { dailyAllowance, formatYen, sumAmount, sumFixed, totalsByCategory } from "../lib/analytics";
import { Bars } from "../ui/Bars";
import { EmptyState } from "../ui/EmptyState";
import { Meter } from "../ui/Meter";
import { PeriodBar } from "../ui/PeriodBar";
import { ExpenseRow } from "./HistoryScreen";
import { useHistoryFilter } from "./historyFilter";

const CATEGORY_LIMIT = 5;

export function HomeScreen() {
  const period = usePeriod();
  const { expenses, loading } = useExpensesInRange(period.start, period.end);
  const { monthlyBudget } = useBudget();
  const navigate = useNavigate();
  const { setCategory } = useHistoryFilter();
  const [selected, setSelected] = useState<Expense | null>(null);

  const total = sumAmount(expenses);
  const fixed = sumFixed(expenses);
  const budget = period.mode === "month" ? monthlyBudget : monthlyBudget * 12;
  const allowance =
    period.mode === "month" ? dailyAllowance(monthlyBudget, total, period.year, period.month) : null;
  const categories = totalsByCategory(expenses);

  return (
    <div className="page">
      <PeriodBar />

      <section className="hero">
        <p className="hero-label">{period.noun}の支出</p>
        <p className="hero-amount">{loading ? "…" : formatYen(total)}</p>
        {fixed > 0 && (
          <p className="hero-sub">
            うち固定費 {formatYen(fixed)}・変動費 {formatYen(total - fixed)}
          </p>
        )}
      </section>

      {budget > 0 ? (
        <section className="block">
          <div className="block-head">
            <span>予算 {formatYen(budget)}</span>
            <span className={total > budget ? "status-error" : undefined}>
              {total > budget
                ? `${formatYen(total - budget)} 超えています`
                : `残り ${formatYen(budget - total)}`}
            </span>
          </div>
          <Meter ratio={total / budget} label="予算の消化" />
          {allowance && allowance.remaining > 0 && (
            <p className="hint">
              今日から月末まで（{allowance.remainingDays}日）、1日あたり{" "}
              <strong>{formatYen(Math.floor(allowance.perDay))}</strong> まで使えます
            </p>
          )}
        </section>
      ) : (
        <section className="block">
          <p className="hint">
            月の予算を決めると、あといくら使えるかがここに出ます。{" "}
            <button className="link-button" onClick={() => navigate("/settings/budget")}>
              予算を決める
            </button>
          </p>
        </section>
      )}

      <hr className="fk-groove" />

      {!loading && expenses.length === 0 ? (
        <EmptyState title={`${period.noun}の記録はまだありません`}>
          右下の［記録する］から、使ったお金を残せます。
        </EmptyState>
      ) : (
        <>
          <section className="block">
            <h2 className="block-title">カテゴリー</h2>
            <Bars
              items={categories.slice(0, CATEGORY_LIMIT).map((c) => ({
                key: c.category,
                label: c.category,
                amount: c.amount,
                note: total > 0 ? `${Math.round((c.amount / total) * 100)}%` : undefined,
              }))}
              onSelect={(c) => {
                setCategory(c);
                navigate("/history");
              }}
            />
            {categories.length > CATEGORY_LIMIT && (
              <button className="link-button" onClick={() => navigate("/insights")}>
                ほか{categories.length - CATEGORY_LIMIT}件のカテゴリーは分析で
              </button>
            )}
          </section>

          <hr className="fk-groove" />

          <section className="block">
            <h2 className="block-title">最近の支出</h2>
            <ul className="expense-list">
              {expenses.slice(0, 5).map((e) => (
                <ExpenseRow key={e.id} expense={e} onOpen={setSelected} />
              ))}
            </ul>
            <button className="link-button" onClick={() => navigate("/history")}>
              すべての支出を履歴で見る
            </button>
          </section>
        </>
      )}

      <AddExpenseButton />
      <ExpenseDetailSheet key={selected?.id} expense={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
