// あゆみ：これまでにいくら貯まったかを見る画面（月末や、ふと確かめたくなったときに開く）。
//
// 何をどこに置くか
// - まとめの札（ガラスは一画面にこの一枚）：これまでに貯まったお金。締まった月（先月まで）の合計
// - 月ごとの棒：長さは貯まった額、細い印は目標。印をこえた月には桜が付く。
//   棒の色は差し色（＝貯まるお金の色）。今月はまだ途中なので、輪郭だけの棒にする
// - 月を押すと、その月の「きろく」が開く（「なぜ届かなかった？」を確かめに行ける）
import { useNavigate } from "react-router";
import { useExpensesInRange } from "../data/hooks";
import { usePlans } from "../data/plan";
import { formatMonth, formatYen } from "../lib/format";
import { parseMonthKey } from "../lib/months";
import { journey, monthStart, startMonth, totalSaved, type JourneyMonth } from "../lib/savings";
import { dayKeyToDate, useToday } from "../lib/useToday";
import { Amount } from "../ui/Amount";
import { Icon } from "../ui/Icon";
import { useRecordsView } from "./recordsView";

export function JourneyScreen() {
  const todayKey = useToday();
  const today = dayKeyToDate(todayKey);
  const { plans, loading: plansLoading } = usePlans();
  const first = startMonth(plans);
  // 数え始めの月から今月末まで
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  const { expenses, loading: expensesLoading } = useExpensesInRange(first ? monthStart(first) : end, end);
  const navigate = useNavigate();
  const { showMonth } = useRecordsView();

  const loading = plansLoading || (first !== null && expensesLoading);
  const months = journey(plans, expenses, today);
  const closed = months.filter((x) => x.closed);
  const scale = Math.max(
    1,
    ...months.map((x) => Math.max(x.plan.goal, x.closed ? x.result.saved : x.result.kept)),
  );

  if (!loading && !first) {
    return (
      <div className="page journey">
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
      </div>
    );
  }

  const since = first ? parseMonthKey(first) : null;
  return (
    <div className="page journey">
      <section className="summary fk-glass" aria-label="これまでに貯まったお金">
        <div className="fk-glass-bd" />
        <div className="fk-glass-in">
          <p className="summary-label">これまでに貯まったお金</p>
          <p className="summary-amount">
            <Amount
              value={totalSaved(months)}
              loading={loading}
              className={totalSaved(months) < 0 ? "is-eaten" : "fk-gradient-text"}
            />
          </p>
          <p className="summary-state">
            {loading || !since
              ? "　"
              : closed.length === 0
                ? "今月が終わると、最初の貯金がここに入ります"
                : `${since.year}年${since.month}月から ${closed.length}ヶ月。目標をこえた月は ${closed.filter((x) => x.result.saved >= x.plan.goal).length}回`}
          </p>
        </div>
      </section>

      <section className="block">
        <h2 className="block-title">月ごと</h2>
        <ol className="months">
          {months.map((x) => (
            <MonthRow
              key={x.month}
              item={x}
              scale={scale}
              today={today}
              onOpen={() => {
                showMonth(x.month);
                navigate("/records");
              }}
            />
          ))}
        </ol>
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
  const { plan, result, closed } = item;
  const amount = closed ? result.saved : result.kept;
  const reached = closed && result.saved >= plan.goal;
  const diff = result.saved - plan.goal;
  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / scale) * 100))}%`;
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
            {amount < 0 ? `−${formatYen(-amount)}` : formatYen(amount)}
          </span>
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
          {!closed
            ? result.over > 0
              ? `使いすぎた ${formatYen(result.over)} が食い込んでいます`
              : `いま守れている額。使えるお金の残り ${formatYen(result.left)} も、余れば月末に加わります`
            : diff >= 0
              ? diff === 0
                ? `目標 ${formatYen(plan.goal)} ちょうど`
                : `目標 ${formatYen(plan.goal)} より ${formatYen(diff)} 多く貯まりました`
              : `目標 ${formatYen(plan.goal)} に ${formatYen(-diff)} 届きませんでした`}
        </span>
      </button>
    </li>
  );
}
