// 分析：振り返りの画面。上ほど「今どうなっているか」、下ほど「傾向」。
//   予算 → 前の期間との比較 → 過去の平均との比較 → 固定費と変動費 → カテゴリー → 推移 → 支出のパターン
// 区分はカードで囲まず、見出しと溝で分ける。
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { AddExpenseButton } from "../expenses/AddExpenseButton";
import { useBudget, useExpensesInRange } from "../data/hooks";
import { usePeriod } from "../data/period";
import type { Expense } from "../data/types";
import { TrendChart, WeekdayChart } from "../insights/charts";
import { SpendingCalendar } from "../insights/SpendingCalendar";
import {
  averageOfMonths,
  categoryMoves,
  dailyAllowance,
  formatYen,
  projectMonthTotal,
  spendingPattern,
  sumAmount,
  sumFixed,
  totalsByCategory,
  totalsByMonth,
  type CategoryMove,
} from "../lib/analytics";
import { addMonths, monthProgress, toMonthKey } from "../lib/months";
import { Bars } from "../ui/Bars";
import { Meter } from "../ui/Meter";
import { PeriodBar } from "../ui/PeriodBar";
import { useThemeColors } from "../ui/useThemeColors";
import { useHistoryFilter } from "./historyFilter";

const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${formatYen(Math.abs(n))}`;
const pct = (cur: number, base: number) => {
  if (!base) return "--";
  const p = Math.round(((cur - base) / base) * 100);
  return `${p > 0 ? "+" : ""}${p}%`;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="insight">
      <h2 className="block-title">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function Moves({ title, list }: { title: string; list: CategoryMove[] }) {
  if (list.length === 0) return null;
  return (
    <div className="moves">
      <span className="stat-label">{title}</span>
      <ul className="moves-list">
        {list.map((m) => (
          <li key={m.category}>
            <span>{m.category}</span>
            <span className="num">
              {signed(m.diff)}
              <span className="muted">（{m.percent === null ? "新しく" : pct(m.current, m.previous)}）</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InsightsScreen() {
  const period = usePeriod();
  const { monthlyBudget } = useBudget();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { setCategory } = useHistoryFilter();
  const isMonth = period.mode === "month";

  // 月：前の6ヶ月から今月まで（前月比・過去平均・推移に使う）。年：前の年から今年まで
  const rangeStart = isMonth ? new Date(period.year, period.month - 7, 1) : new Date(period.year - 1, 0, 1);
  const { expenses: all, loading } = useExpensesInRange(rangeStart, period.end);

  const data = useMemo(() => {
    const inRange = (e: Expense, s: Date, en: Date) => {
      const d = new Date(e.date);
      return d >= s && d <= en;
    };
    const current = all.filter((e) => inRange(e, period.start, period.end));
    const prevStart = isMonth ? new Date(period.year, period.month - 2, 1) : new Date(period.year - 1, 0, 1);
    const prevEnd = new Date(period.start.getTime() - 1);
    const previous = all.filter((e) => inRange(e, prevStart, prevEnd));
    const monthTotals = totalsByMonth(all);
    const currentKey = isMonth ? `${period.year}-${String(period.month).padStart(2, "0")}` : "";
    const past6 = isMonth ? Array.from({ length: 6 }, (_, i) => addMonths(currentKey, -(i + 1))) : [];

    // 推移：月なら直近7ヶ月、年なら12ヶ月（まだ来ていない月は線を引かない）
    const nowKey = toMonthKey(new Date());
    const trendKeys = isMonth
      ? Array.from({ length: 7 }, (_, i) => addMonths(currentKey, i - 6))
      : Array.from({ length: 12 }, (_, i) => `${period.year}-${String(i + 1).padStart(2, "0")}`);
    const trend = trendKeys.map((k) => ({
      label: `${Number(k.slice(5))}月`,
      total: k > nowKey ? null : (monthTotals[k] ?? 0),
    }));
    const elapsedTrend = trend.filter((t) => t.total !== null).map((t) => t.total as number);
    const trendAverage = elapsedTrend.some((v) => v > 0)
      ? elapsedTrend.filter((v) => v > 0).reduce((a, b) => a + b, 0) /
        elapsedTrend.filter((v) => v > 0).length
      : null;

    return { current, previous, monthTotals, past6, trend, trendAverage };
  }, [all, period.start, period.end, period.year, period.month, isMonth]);

  const { current, previous, monthTotals, past6, trend, trendAverage } = data;
  const total = sumAmount(current);
  const fixed = sumFixed(current);
  const budget = isMonth ? monthlyBudget : monthlyBudget * 12;
  const projected = isMonth ? projectMonthTotal(total, fixed, period.year, period.month) : null;
  const allowance = isMonth ? dailyAllowance(monthlyBudget, total, period.year, period.month) : null;
  const prevTotal = sumAmount(previous);
  const moves = categoryMoves(current, previous);
  const categories = totalsByCategory(current);
  const pattern = spendingPattern(current, period.start, period.end);
  const progress = isMonth ? monthProgress(period.year, period.month) : null;

  const avg3 = isMonth ? averageOfMonths(past6.slice(0, 3), monthTotals) : null;
  const avg6 = isMonth ? averageOfMonths(past6, monthTotals) : null;
  const compareValue = projected ?? total;

  // カテゴリーごとの、過去6ヶ月（記録のある月）の平均との比較
  const categoryVsAverage = useMemo(() => {
    if (!isMonth || !avg6) return [];
    const pastKeys = new Set(past6);
    const past = all.filter((e) => pastKeys.has(toMonthKey(new Date(e.date))));
    const avg = new Map(totalsByCategory(past).map((c) => [c.category, c.amount / avg6.months]));
    const cur = new Map(totalsByCategory(current).map((c) => [c.category, c.amount]));
    return [...new Set([...cur.keys(), ...avg.keys()])]
      .map((category) => ({ category, current: cur.get(category) ?? 0, average: avg.get(category) ?? 0 }))
      .sort((a, b) => Math.max(b.current, b.average) - Math.max(a.current, a.average))
      .slice(0, 6);
  }, [isMonth, avg6, past6, all, current]);
  const prevNoun = isMonth ? "前の月" : "前の年";

  const fixedItems = totalsByCategory(
    current.filter((e) => e.isFixed).map((e) => ({ ...e, category: e.description || e.category })),
  );

  if (loading) {
    return (
      <div className="page">
        <PeriodBar />
        <p className="hint">集計しています…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PeriodBar />

      <Section title="予算">
        {budget > 0 ? (
          <>
            <div className="stats">
              <Stat
                label="使った割合"
                value={`${Math.round((total / budget) * 100)}%`}
                sub={`${formatYen(total)} / ${formatYen(budget)}`}
              />
              {projected !== null ? (
                <Stat
                  label="月末の見込み"
                  value={formatYen(projected)}
                  sub={
                    projected > budget
                      ? `予算を ${formatYen(projected - budget)} 超えそう`
                      : `予算内（あと ${formatYen(budget - projected)}）`
                  }
                />
              ) : (
                <Stat
                  label={total > budget ? "超えた額" : "残り"}
                  value={formatYen(Math.abs(budget - total))}
                />
              )}
            </div>
            <Meter ratio={total / budget} label="予算の消化" />
            {allowance && (
              <p className="hint">
                {allowance.remaining > 0
                  ? `残り${allowance.remainingDays}日、1日あたり ${formatYen(Math.floor(allowance.perDay))} まで使えます。`
                  : "今月の予算は使い切りました。"}
                {projected !== null && " 見込みは、固定費と、今日までのペースで続けた変動費の合計です。"}
              </p>
            )}
          </>
        ) : (
          <p className="hint">
            予算を決めると、使った割合と月末の見込みが出ます。{" "}
            <button className="link-button" onClick={() => navigate("/settings/budget")}>
              予算を決める
            </button>
          </p>
        )}
      </Section>

      <Section title={`${prevNoun}との比較`}>
        <div className="stats">
          <Stat label={`${prevNoun}`} value={formatYen(prevTotal)} />
          <Stat label="差" value={signed(total - prevTotal)} sub={pct(total, prevTotal)} />
        </div>
        {progress?.inProgress && (
          <p className="hint">
            {period.noun}はまだ途中（{progress.elapsed}日目）なので、差は月末に向けて変わります。
          </p>
        )}
        <Moves title="増えたカテゴリー" list={moves.increases} />
        <Moves title="減ったカテゴリー" list={moves.decreases} />
      </Section>

      {isMonth && (avg3 || avg6) && (
        <Section title="いつもの月との比較">
          <div className="stats">
            {avg3 && (
              <Stat
                label="過去3ヶ月の平均"
                value={formatYen(avg3.value)}
                sub={`${projected !== null ? "見込み" : period.noun}は ${pct(compareValue, avg3.value)}`}
              />
            )}
            {avg6 && (
              <Stat
                label="過去6ヶ月の平均"
                value={formatYen(avg6.value)}
                sub={`${projected !== null ? "見込み" : period.noun}は ${pct(compareValue, avg6.value)}`}
              />
            )}
          </div>
          <p className="hint">
            {projected !== null ? `月末の見込み（${formatYen(projected)}）で比べています。` : ""}
            平均は記録のある月（{avg6?.months ?? avg3?.months}ヶ月）だけで出しています。
          </p>
          {categoryVsAverage.length > 0 && (
            <>
              <h3 className="sub-title">
                カテゴリーごと（過去6ヶ月の平均と{progress?.inProgress ? "、今日までの実績で" : ""}）
              </h3>
              <ul className="moves-list">
                {categoryVsAverage.map((c) => (
                  <li key={c.category}>
                    <span>{c.category}</span>
                    <span className="num">
                      {formatYen(c.current)}
                      <span className="muted">
                        {" "}
                        / 平均 {formatYen(c.average)}（
                        {c.average > 0 ? `${Math.round((c.current / c.average) * 100)}%` : "新しく"}）
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>
      )}

      {fixed > 0 && (
        <Section title="固定費と変動費">
          <div className="stats">
            <Stat label="固定費" value={formatYen(fixed)} sub={`${Math.round((fixed / total) * 100)}%`} />
            <Stat
              label="変動費"
              value={formatYen(total - fixed)}
              sub={`${Math.round(((total - fixed) / total) * 100)}%`}
            />
          </div>
          <p className="hint">
            固定費は毎月決まって出ていくお金です。見直すなら変動費から、大きく変えるなら固定費から。
          </p>
          <Bars items={fixedItems.map((f) => ({ key: f.category, label: f.category, amount: f.amount }))} />
        </Section>
      )}

      {categories.length > 0 && (
        <Section title="カテゴリー">
          <Bars
            items={categories.map((c) => ({
              key: c.category,
              label: c.category,
              amount: c.amount,
              note: `${Math.round((c.amount / total) * 100)}%`,
            }))}
            onSelect={(c) => {
              setCategory(c);
              navigate("/history");
            }}
          />
        </Section>
      )}

      <Section title={isMonth ? "支出の推移（7ヶ月）" : "支出の推移（月ごと）"}>
        <TrendChart data={trend} budget={monthlyBudget} average={trendAverage} colors={colors} />
      </Section>

      {pattern.elapsedDays > 0 && current.some((e) => !e.isFixed) && (
        <Section title="支出のパターン">
          <div className="stats">
            <Stat
              label="使わなかった日"
              value={`${pattern.noSpendDays}日`}
              sub={`${pattern.elapsedDays}日のうち`}
            />
            <Stat
              label="よく使う曜日"
              value={`${pattern.top.name}曜日`}
              sub={`1日平均 ${formatYen(pattern.top.average)}`}
            />
          </div>
          <p className="hint">固定費を除いた、ふだんの支出で数えています。</p>
          <h3 className="sub-title">曜日ごとの1日平均</h3>
          <WeekdayChart data={pattern.weekdays} colors={colors} />
          {isMonth && (
            <>
              <h3 className="sub-title">日ごと</h3>
              <SpendingCalendar
                key={`${period.year}-${period.month}`}
                year={period.year}
                month={period.month}
                byDay={pattern.byDay}
                maxDaily={pattern.maxDaily}
                peak={pattern.peak}
              />
            </>
          )}
        </Section>
      )}

      <AddExpenseButton />
    </div>
  );
}
