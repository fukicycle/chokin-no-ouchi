// 貯金の計画。家族で共有する。月の手取りと、毎月貯めたい額の2つだけを決める。
// 「使えるお金」は引き算で決まるので、打ちながら下に出す（決めた結果がその場で見える）。
// 保存はいちばん下。今月の分から有効になり、先月までの「あゆみ」は変わらない。
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useFixedCosts } from "../../data/hooks";
import { usePlans } from "../../data/plan";
import { formatYen } from "../../lib/format";
import { toMonthKey } from "../../lib/months";
import { planFor, startMonth, type Plan } from "../../lib/savings";
import { useFeedback } from "../../ui/Feedback";

export function PlanScreen() {
  const { plans, legacyBudget, loading, savePlan } = usePlans();
  if (loading) return null;
  const current = planFor(plans, toMonthKey(new Date()));
  return (
    <PlanForm
      key={current ? `${current.income}-${current.goal}` : "new"}
      initial={current}
      first={startMonth(plans) === null}
      legacyBudget={legacyBudget}
      save={savePlan}
    />
  );
}

function PlanForm({
  initial,
  first,
  legacyBudget,
  save,
}: {
  initial: Plan | null;
  first: boolean;
  legacyBudget: number;
  save: (plan: Plan) => Promise<void>;
}) {
  const { fixedCosts } = useFixedCosts();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const [income, setIncome] = useState(initial ? String(initial.income) : "");
  const [goal, setGoal] = useState(initial ? String(initial.goal) : "");

  const i = Number(income) || 0;
  const g = Number(goal) || 0;
  const budget = i - g;
  const fixed = fixedCosts.reduce((s, f) => s + f.amount, 0);
  const valid = i > 0 && g >= 0 && budget >= 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    await save({ income: i, goal: g });
    toast({ message: "貯金の計画を保存しました" });
    navigate(-1);
  };

  return (
    <form className="page form" onSubmit={submit}>
      <p className="lead">
        手取りから、先に貯金を取り分けます。残りが「使えるお金」です。家族全員に同じ計画が出ます。
      </p>
      <label className="field">
        <span className="field-label">月の手取り（円）</span>
        <input
          className="fk-input field-amount"
          type="number"
          inputMode="numeric"
          min="0"
          required
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder="例：300000"
        />
      </label>
      <label className="field">
        <span className="field-label">毎月貯めたい額（円）</span>
        <input
          className="fk-input field-amount"
          type="number"
          inputMode="numeric"
          min="0"
          required
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="例：50000"
        />
      </label>

      {/* 高さを決めておく（打っている途中で下のボタンが動かないように） */}
      <div className="plan-result" aria-live="polite">
        <span className="plan-result-label">使えるお金</span>
        <span className={budget < 0 ? "plan-result-value is-eaten" : "plan-result-value"}>
          {i > 0 ? (budget < 0 ? `−${formatYen(-budget)}` : formatYen(budget)) : "—"}
        </span>
        <span className="plan-result-note">
          {i <= 0
            ? legacyBudget > 0
              ? `いままでの月の予算は ${formatYen(legacyBudget)} でした`
              : "手取りを入れると出ます"
            : budget < 0
              ? "貯めたい額が手取りをこえています"
              : fixed > 0
                ? `固定費 ${formatYen(fixed)} を引くと、ふだん使えるのは ${formatYen(Math.max(0, budget - fixed))}`
                : "固定費もこの中から出します"}
        </span>
      </div>

      <p className="hint">
        {first
          ? "保存した今月から、貯まった額を数え始めます。"
          : "今月の分から変わります。先月までの「あゆみ」は変わりません。"}
      </p>
      <button className="fk-button fk-button--primary fk-button--block form-submit" disabled={!valid}>
        保存する
      </button>
    </form>
  );
}
