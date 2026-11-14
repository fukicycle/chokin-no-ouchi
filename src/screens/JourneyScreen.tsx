// あゆみ：これまでにいくら貯まったか、使い方がどう変わってきたかを見る画面（月末や、ふと確かめたくなったときに開く）。
//
// 何をどこに置くか
// - まとめの札（ガラスは一画面にこの一枚）：これまでに貯まったお金。締まった月（先月まで）の合計。
//   特別費（車検・結婚式など）は、月ごとの判定には数えないが、ここからは引く（実際に出ていったお金なので）
// - 月ごとの貯金：棒の長さは貯まった額、細い印は目標。印をこえた月には桜が付く。
//   棒の色は差し色（＝貯まるお金の色）。今月はまだ途中なので、輪郭だけの棒にする
// - つかったお金の推移：この12ヶ月。計画を立てる前の月も出る。棒は文字の色（＝使ったお金の色）、
//   特別費は上に輪郭だけで積む。点線は今の「使えるお金」
// - どの月も、押すとその月の「きろく」が開く（「なぜ多かった？」を確かめに行ける）
import { useNavigate } from "react-router";
import { useExpensesInRange } from "../data/hooks";
import { usePlans } from "../data/plan";
import { formatMonth, formatSignedYen, formatYen } from "../lib/format";
import { addMonths, parseMonthKey, toMonthKey, type MonthKey } from "../lib/months";
import {
  budgetOf,
  journey,
  monthStart,
  planFor,
  spendingTrend,
  startMonth,
  totalSaved,
  totalSpecial,
  type JourneyMonth,
  type TrendMonth,
} from "../lib/savings";
import { dayKeyToDate, useToday } from "../lib/useToday";
import { Amount } from "../ui/Amount";
import { Icon } from "../ui/Icon";
import { useRecordsView } from "./recordsView";

const TREND_MONTHS = 12;

export function JourneyScreen() {
  const todayKey = useToday();
  const today = dayKeyToDate(todayKey);
  const current = toMonthKey(today);
  const { plans, loading: plansLoading } = usePlans();
  const first = startMonth(plans);
  // 推移の12ヶ月と、数え始めの月の、古いほうから今月末まで
  const trendStart = addMonths(current, -(TREND_MONTHS - 1));
  const from = monthStart(first && first < trendStart ? first : trendStart);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  const { expenses, loading: expensesLoading } = useExpensesInRange(from, end);
  const navigate = useNavigate();
  const { showMonth } = useRecordsView();

  const loading = plansLoading || expensesLoading;
  const months = journey(plans, expenses, today);
  const closed = months.filter((x) => x.closed);
  const scale = Math.max(
    1,
    ...months.map((x) => Math.max(x.plan.goal, x.closed ? x.result.saved : x.result.kept)),
  );
  const total = totalSaved(months);
  const special = totalSpecial(months);
  const plan = planFor(plans, current);
  const open = (month: MonthKey) => {
    showMonth(month);
    navigate("/records");
  };

  const since = first ? parseMonthKey(first) : null;
  return (
    <div className="page journey">
      {!loading && !first ? (
        <section className="summary fk-glass" aria-label="貯金の計画">
          <div className="fk-glass-bd" />
          <div className="fk-glass-in">
            <p className="summary-label">まだ数え始めていません</p>
            <p className="lead">
              貯金の計画を立てた月から、月が終わるたびに貯まった額がここに積み上がります。
            </p>
            <button className="fk-button fk-button--block" onClick={() => navigate("/settings/plan")}>
              計画を立てる
              <Icon name="forward" size="sm" />
            </button>
          </div>
        </section>
      ) : (
        <section className="summary fk-glass" aria-label="これまでに貯まったお金">
          <div className="fk-glass-bd" />
          <div className="fk-glass-in">
            <p className="summary-label">これまでに貯まったお金</p>
            <p className="summary-amount">
              <Amount
                value={total}
                loading={loading}
                className={total < 0 ? "is-eaten" : "fk-gradient-text"}
              />
            </p>
            <p className="summary-state">
              {loading || !since
                ? "　"
                : closed.length === 0
                  ? "今月が終わると、最初の貯金がここに入ります"
                  : `${since.year}年${since.month}月から ${closed.length}ヶ月。目標をこえた月は ${closed.filter((x) => x.result.saved >= x.plan.goal).length}回${special > 0 ? `。特別費 ${formatYen(special)} を引いたあとの額です` : ""}`}
            </p>
          </div>
        </section>
      )}

      {months.length > 0 && (
        <section className="block">
          <h2 className="block-title">月ごとの貯金</h2>
          <ol className="months">
            {months.map((x) => (
              <MonthRow key={x.month} item={x} scale={scale} today={today} onOpen={() => open(x.month)} />
            ))}
          </ol>
        </section>
      )}

      <section className="block">
        <h2 className="block-title">つかったお金の推移</h2>
        <Trend
          months={spendingTrend(expenses, TREND_MONTHS, today)}
          budget={plan ? budgetOf(plan) : 0}
          loading={loading}
          onOpen={open}
        />
      </section>
    </div>
  );
}

function MonthRow({
  item,
  scale,
  today,
  onOpen,
}: {
  item: JourneyMonth;
  scale: number;
  today: Date;
  onOpen: () => void;
}) {
  const { plan, result, closed, special } = item;
  const amount = closed ? result.saved : result.kept;
  const reached = closed && result.saved >= plan.goal;
  const diff = result.saved - plan.goal;
  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / scale) * 100))}%`;
  const note = !closed
    ? result.over > 0
      ? `使いすぎた ${formatYen(result.over)} が食い込んでいます`
      : `いま守れている額。使えるお金の残り ${formatYen(result.left)} も、余れば月末に加わります`
    : diff >= 0
      ? diff === 0
        ? `目標 ${formatYen(plan.goal)} ちょうど`
        : `目標 ${formatYen(plan.goal)} より ${formatYen(diff)} 多く貯まりました`
      : `目標 ${formatYen(plan.goal)} に ${formatYen(-diff)} 届きませんでした`;
  return (
    <li>
      <button className="month" onClick={onOpen}>
        <span className="month-head">
          <span className="month-name">
            {formatMonth(item.month, today)}
            {!closed && <span className="tag">途中</span>}
          </span>
          {reached && <Icon name="sakura" size="sm" className="month-reached" />}
          <span className={amount < 0 ? "month-amount is-eaten" : "month-amount"}>
            {formatSignedYen(amount)}
          </span>
          <Icon name="forward" size="sm" className="row-go" />
        </span>
        <span className="month-track">
          {amount > 0 && (
            <span
              className={closed ? "month-fill" : "month-fill month-fill--open"}
              style={{ width: pct(amount) }}
            />
          )}
          <span className="month-goal" style={{ left: pct(plan.goal) }} />
        </span>
        <span className="month-note">
          {note}
          {special > 0 && `。ほかに特別費 ${formatYen(special)}`}
        </span>
      </button>
    </li>
  );
}

/** 万円（小数1桁まで。10万円以上は整数） */
const inMan = (n: number) => {
  const man = n / 10000;
  return man >= 10 ? String(Math.round(man)) : man === 0 ? "0" : man.toFixed(1);
};

function Trend({
  months,
  budget,
  loading,
  onOpen,
}: {
  months: TrendMonth[];
  budget: number;
  loading: boolean;
  onOpen: (month: MonthKey) => void;
}) {
  const scale = Math.max(1, budget, ...months.map((x) => x.normal + x.special)) * 1.08;
  const pct = (n: number) => `${(n / scale) * 100}%`;
  const hasSpecial = months.some((x) => x.special > 0);
  return (
    <div className="trend">
      <div className="trend-plot">
        {budget > 0 && <span className="trend-budget" style={{ bottom: pct(budget) }} />}
        {months.map((x) => {
          const { month: m } = parseMonthKey(x.month);
          const sum = x.normal + x.special;
          return (
            <button
              key={x.month}
              className="trend-col"
              aria-label={`${formatMonth(x.month)}：${formatYen(x.normal)}${x.special > 0 ? `、特別費 ${formatYen(x.special)}` : ""}`}
              onClick={() => onOpen(x.month)}
            >
              <span className="trend-bars">
                <span className="trend-value">{loading || sum === 0 ? "" : inMan(sum)}</span>
                {x.special > 0 && <span className="trend-special" style={{ height: pct(x.special) }} />}
                <span className="trend-normal" style={{ height: loading ? 0 : pct(x.normal) }} />
              </span>
              <span className="trend-month">{m}</span>
            </button>
          );
        })}
      </div>
      <p className="trend-legend">
        <span>
          <i className="swatch swatch--spent" />
          ふだん
        </span>
        {hasSpecial && (
          <span>
            <i className="swatch swatch--special" />
            特別費
          </span>
        )}
        {budget > 0 && (
          <span>
            <i className="swatch-line" />
            使えるお金 {formatYen(budget)}
          </span>
        )}
        <span className="trend-unit">棒の上の数字は万円</span>
      </p>
    </div>
  );
}
