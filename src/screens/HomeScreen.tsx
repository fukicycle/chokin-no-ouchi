// ちょきん：開いてすぐ「今月の貯金は守れているか」と「今日あといくら使えるか」が分かる画面。
//
// 何をどこに置くか
// - まとめの札（ガラスは一画面にこの一枚）：今月の貯金。先に取り分けた額が、いま守れているか。
//   帯は手取りの行き先。左から「つかった」が伸び、右端に「ちょきん」が待っている。
//   使いすぎると「つかった」が「ちょきん」に食い込む（その分だけ色が変わり、上の数字が減る）
// - 特別費（車検・結婚式など）は帯にも数字にも数えない。あった月だけ、札の下に一行で知らせる
// - 今日つかえるお金：買う前にここを見る。札のすぐ下、スクロールしなくても見える所に、数字を大きく
// - 今日のきろく：いま入れた記録が入ったか確かめる所。行を押すと直せる
// - 記録するボタンは右下（AppShell）。この画面に主ボタンは足さない
import { useNavigate } from "react-router";
import { useExpensesInRange } from "../data/hooks";
import type { Expense } from "../data/types";
import { usePlans } from "../data/plan";
import { dayKey, formatYen } from "../lib/format";
import { monthRange, parseMonthKey } from "../lib/months";
import {
  budgetOf,
  monthResult,
  planFor,
  sumAmount,
  sumNormal,
  sumSpecial,
  todayAllowance,
  type MonthResult,
  type Plan,
} from "../lib/savings";
import { dayKeyToDate, useToday } from "../lib/useToday";
import { Amount } from "../ui/Amount";
import { ExpenseRow } from "../ui/ExpenseRow";
import { Icon } from "../ui/Icon";

export function HomeScreen() {
  const todayKey = useToday();
  const today = dayKeyToDate(todayKey);
  const month = todayKey.slice(0, 7);
  const { year, month: m } = parseMonthKey(month);
  const { start, end } = monthRange(year, m);
  const { expenses, loading: expensesLoading } = useExpensesInRange(start, end);
  const { plans, legacyBudget, loading: plansLoading } = usePlans();
  const navigate = useNavigate();

  const loading = expensesLoading || plansLoading;
  const plan = planFor(plans, month);
  // 特別費は「使えるお金」に数えない
  const spent = sumNormal(expenses);
  const special = sumSpecial(expenses);
  const todays = expenses.filter((e) => dayKey(new Date(e.date)) === todayKey && !e.isFixed);

  return (
    <div className="page home">
      {loading || plan ? (
        <Summary month={m} plan={plan} result={plan ? monthResult(plan, spent) : null} special={special} />
      ) : (
        <section className="summary fk-glass" aria-label="貯金の計画">
          <div className="fk-glass-bd" />
          <div className="fk-glass-in">
            <p className="summary-label">貯金の計画がまだありません</p>
            <p className="lead">
              月の手取りと、毎月貯めたい額を決めると、今日あといくら使えるかが分かります。
              {legacyBudget > 0 && `いままでの月の予算は ${formatYen(legacyBudget)} でした。`}
            </p>
            <button className="fk-button fk-button--block" onClick={() => navigate("/settings/plan")}>
              計画を立てる
              <Icon name="forward" size="sm" />
            </button>
          </div>
        </section>
      )}

      <section className="today" aria-label="今日つかえるお金">
        <h2 className="block-title">{plan || loading ? "今日つかえるお金" : `${m}月につかったお金`}</h2>
        {plan || loading ? (
          <Today plan={plan} expenses={expenses} today={today} loading={loading} />
        ) : (
          <p className="today-amount">
            <Amount value={spent} />
          </p>
        )}
      </section>

      <section className="block">
        <div className="block-head">
          <h2 className="block-title">今日のきろく</h2>
          {todays.length > 0 && <span className="block-value">{formatYen(sumAmount(todays))}</span>}
        </div>
        {todays.length > 0 ? (
          <ul className="expenses">
            {todays.map((e) => (
              <ExpenseRow key={e.id} expense={e} />
            ))}
          </ul>
        ) : (
          <p className="quiet">{loading ? "　" : "今日はまだ記録がありません"}</p>
        )}
      </section>
    </div>
  );
}

function Summary({
  month,
  plan,
  result,
  special,
}: {
  month: number;
  plan: Plan | null;
  result: MonthResult | null;
  special: number;
}) {
  const waiting = !plan || !result;
  const over = result?.over ?? 0;
  return (
    <section className="summary fk-glass" aria-label="今月の貯金">
      <div className="fk-glass-bd" />
      <div className="fk-glass-in">
        <p className="summary-label">{month}月の貯金</p>
        <p className="summary-amount">
          <Amount
            value={result?.kept ?? 0}
            loading={waiting}
            className={over > 0 ? "is-eaten" : "fk-gradient-text"}
          />
        </p>
        <p className={over > 0 ? "summary-state is-eaten" : "summary-state"}>
          {waiting ? (
            "　"
          ) : over > 0 ? (
            <>
              <Icon name="warning" size="sm" />
              {result && result.saved < 0
                ? `手取りを ${formatYen(-result.saved)} こえて使っています`
                : `使いすぎた ${formatYen(over)} が、貯金に食い込んでいます`}
            </>
          ) : (
            <>
              <Icon name="check" size="sm" />
              守れています。使えるお金が余れば、月末に上乗せされます
            </>
          )}
        </p>

        <Flow plan={plan} result={result} />
        {special > 0 && (
          <p className="summary-special">ほかに特別費 {formatYen(special)}（ここには数えていません）</p>
        )}
      </div>
    </section>
  );
}

/** 手取りの行き先の帯。幅は手取りに対する割合 */
function Flow({ plan, result }: { plan: Plan | null; result: MonthResult | null }) {
  const income = plan?.income || 1;
  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / income) * 100))}%`;
  const budget = result?.budget ?? 0;
  const spent = result?.spent ?? 0;
  const goal = plan?.goal ?? 0;
  const over = result?.over ?? 0;
  return (
    <>
      <div
        className="flow"
        role="img"
        aria-label={
          plan && result
            ? `手取り ${formatYen(plan.income)} のうち、つかった ${formatYen(spent)}、のこり ${formatYen(result.left)}、ちょきん ${formatYen(result.kept)}`
            : undefined
        }
      >
        <span className="flow-saving" style={{ width: pct(goal) }} />
        <span className="flow-spent" style={{ width: pct(Math.min(spent, budget)) }} />
        <span className="flow-over" style={{ left: pct(budget), width: pct(Math.min(over, goal)) }} />
      </div>
      <dl className="flow-legend">
        <div>
          <dt>
            <i className="swatch swatch--spent" />
            つかった
          </dt>
          <dd>
            <Amount value={spent} loading={!result} />
          </dd>
        </div>
        <div>
          <dt>
            <i className="swatch swatch--left" />
            のこり
          </dt>
          <dd>
            <Amount value={result?.left ?? 0} loading={!result} />
          </dd>
        </div>
        <div>
          <dt>
            <i className="swatch swatch--saving" />
            ちょきん
          </dt>
          <dd>
            <Amount value={result?.kept ?? 0} loading={!result} />
          </dd>
        </div>
      </dl>
    </>
  );
}

function Today({
  plan,
  expenses,
  today,
  loading,
}: {
  plan: Plan | null;
  expenses: Expense[];
  today: Date;
  loading: boolean;
}) {
  const budget = plan ? budgetOf(plan) : 0;
  const a = todayAllowance(budget, expenses, today);
  const waiting = loading || !plan;
  const usedUp = sumNormal(expenses) >= budget;
  return (
    <>
      <p className="today-amount">
        <span className="today-prefix">あと</span>
        <Amount value={a.leftToday} loading={waiting} />
      </p>
      <p className="today-note">
        {waiting
          ? "　"
          : usedUp
            ? "今月の使えるお金は使い切りました。ここから先は貯金が減ります"
            : a.overToday > 0
              ? a.nextPerDay === null
                ? `今日の分を ${formatYen(a.overToday)} こえました`
                : `今日の分を ${formatYen(a.overToday)} こえました。明日からは1日 ${formatYen(a.nextPerDay)}`
              : `今日の分は ${formatYen(a.perDay)}。月末まで${a.daysLeft}日、この中なら貯金は守れます`}
      </p>
    </>
  );
}
