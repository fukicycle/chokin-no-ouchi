// ちょきん：貯金だけを見る画面。開いてすぐ「今月の貯金は守れているか」「今日あといくら使えるか」
// 「このままだと月末にいくら貯まるか」が分かる。
//
// 置かないもの：今日の支出の一覧。貯金の画面に「何に使ったか」が混ざると、見る目的がぼやける。
// 記録できたかはトーストで分かり、確かめたり直したりするのは「きろく」の暦（今日の升）で行う。
//
// 何をどこに置くか
// - まとめの札（ガラスは一画面にこの一枚）：今月の貯金。先に取り分けた額が、いま守れているか。
//   帯は手取りの行き先。左から「つかった」が伸び、右端に「ちょきん」が待っている。
//   使いすぎると「つかった」が「ちょきん」に食い込む（その分だけ色が変わり、上の数字が減る）
// - 特別費（車検・結婚式など）は帯にも数字にも数えない。あった月だけ、札の下に一行で知らせる
// - 今日つかえるお金：買う前にここを見る。札のすぐ下、スクロールしなくても見える所に、数字を大きく
// - 月末の見込み：ふだんの支出を今日までのペースで月末まで伸ばしたとき、いくら貯まるか（monthOutlook）。
//   棒は札の「今月の貯金」（目標まで。塗り）に、余りそうな使えるお金（輪郭だけ。まだ決まっていないので）を継ぎ足した形。
//   札の数字と見込みの数字が別物に見えないよう、「取り分けた額＋上乗せ」として一本の棒で見せる。
//   形は「あゆみ」の月ごとの棒と同じ（細い印は目標）。月末にそのまま、あゆみに並ぶものだと分かるように
//   今日の分の下に置く（今日の分の中で暮らすと、この見込みが守られる、という順に読める）
// - 記録するボタンは右下（AppShell）。この画面に主ボタンは足さない
import { useNavigate } from "react-router";
import { useExpensesInRange } from "../data/hooks";
import type { Expense } from "../data/types";
import { usePlans } from "../data/plan";
import { formatYen } from "../lib/format";
import { monthRange, parseMonthKey } from "../lib/months";
import {
  budgetOf,
  monthOutlook,
  monthResult,
  planFor,
  sumNormal,
  sumSpecial,
  todayAllowance,
  type MonthResult,
  type Plan,
} from "../lib/savings";
import { dayKeyToDate, useToday } from "../lib/useToday";
import { Amount } from "../ui/Amount";
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

      {(plan || loading) && (
        <section className="block" aria-label="月末の見込み">
          <h2 className="block-title">月末の見込み</h2>
          <Outlook plan={plan} expenses={expenses} today={today} loading={loading} />
        </section>
      )}
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
              守れています。手取り {plan ? formatYen(plan.income) : ""} から、先に取り分けてあります
            </>
          )}
        </p>

        <Flow plan={plan} result={result} />
        {/* 特別費があった月だけ知らせる。場所はいつも取っておく（届いたときに下が動かないように） */}
        <p className="summary-special">
          {special > 0 ? `ほかに特別費 ${formatYen(special)}（ここには数えていません）` : "　"}
        </p>
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

function Outlook({
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
  const waiting = loading || !plan;
  const o = plan ? monthOutlook(plan, expenses, today) : null;
  const goal = plan?.goal ?? 0;
  const saved = o?.saved ?? 0;
  const scale = Math.max(1, goal, saved) * 1.15;
  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / scale) * 100))}%`;
  const early = o !== null && o.elapsed <= 3 ? "まだ月の初めなので、ここから大きく変わります。" : "";
  const note =
    waiting || !o
      ? "　"
      : saved < 0
        ? `${early}このままだと、手取りを ${formatYen(-saved)} こえて使うことになります`
        : o.diff >= 0
          ? `${early}このままのペースなら、使えるお金が ${formatYen(o.diff)} 余り、取り分けた ${formatYen(goal)} に上乗せされます`
          : `${early}このままだと、取り分けた ${formatYen(goal)} に ${formatYen(-o.diff)} 食い込みます。今日の分の中で暮らせば守れます`;
  return (
    <>
      <p className="outlook-amount">
        <Amount value={saved} loading={waiting} className={saved < 0 ? "is-eaten" : "outlook-saving"} />
      </p>
      <span
        className="month-track outlook-track"
        role="img"
        aria-label={o ? `目標 ${formatYen(goal)} に対して、見込み ${formatYen(saved)}` : undefined}
      >
        {!waiting && saved > 0 && (
          <span className="month-fill" style={{ width: pct(Math.min(saved, goal)) }} />
        )}
        {!waiting && saved > goal && (
          <span
            className="outlook-extra"
            style={{ left: pct(goal), width: `calc(${pct(saved - goal)} - 3px)` }}
          />
        )}
        <span className="month-goal" style={{ left: pct(goal) }} />
      </span>
      <p className={o && o.diff < 0 ? "today-note is-short" : "today-note"}>{note}</p>
    </>
  );
}
