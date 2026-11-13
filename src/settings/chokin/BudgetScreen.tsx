// 月の予算。家族で共有する。決めると、ホームに「あといくら・1日あたり」、分析に「月末の見込み」が出る。
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useBudget, useFixedCosts } from "../../data/hooks";
import { formatYen } from "../../lib/analytics";
import { useFeedback } from "../../ui/Feedback";

export function BudgetScreen() {
  const { monthlyBudget, saveBudget, loading } = useBudget();
  if (loading) return null;
  // 読み込んだ予算を最初の値にする（変わったら作り直す）
  return <BudgetForm key={monthlyBudget} initial={monthlyBudget} save={saveBudget} />;
}

function BudgetForm({ initial, save }: { initial: number; save: (n: number) => Promise<void> }) {
  const { fixedCosts } = useFixedCosts();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const [value, setValue] = useState(initial ? String(initial) : "");
  const fixed = fixedCosts.reduce((s, f) => s + f.amount, 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await save(Number(value) || 0);
    toast({ message: Number(value) ? "予算を保存しました" : "予算をなしにしました" });
    navigate(-1);
  };

  return (
    <form className="page form" onSubmit={submit}>
      <p className="lead">
        1ヶ月に使ってよい金額です。固定費も含めた、すべての支出と比べます。家族全員に同じ予算が出ます。
      </p>
      <label className="field">
        <span className="field-label">月の予算（円）</span>
        <input
          className="fk-input field-amount"
          type="number"
          inputMode="numeric"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="例：200000"
        />
      </label>
      {fixed > 0 && (
        <p className="hint">
          登録している固定費は月 {formatYen(fixed)} です。
          {Number(value) > fixed && `ふだんの支出に使えるのは月 ${formatYen(Number(value) - fixed)} です。`}
        </p>
      )}
      <button className="fk-button fk-button--primary fk-button--block form-submit">保存する</button>
    </form>
  );
}
