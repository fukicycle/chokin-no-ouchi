// レシートから読み取った内容を確かめて直す欄。読み取りの間違いを直すためのものなので、
// 金額・カテゴリー・メモ・日付を1件ずつそのまま書き換えられるようにしてある。
import { useCategories } from "../data/hooks";
import { dateInputToIso } from "../data/expenses";
import type { ExpenseInput } from "../data/types";

export type ExpenseDraft = { amount: string; category: string; description: string; date: string };

export const draftToInput = (
  d: ExpenseDraft,
): Pick<ExpenseInput, "amount" | "category" | "description" | "date"> => ({
  amount: Number(d.amount),
  category: d.category.trim(),
  description: d.description.trim(),
  date: dateInputToIso(d.date),
});

export function ReceiptFields({
  draft,
  onChange,
  idPrefix,
}: {
  draft: ExpenseDraft;
  onChange: (d: ExpenseDraft) => void;
  idPrefix: string;
}) {
  const categories = useCategories();
  const set = (k: keyof ExpenseDraft) => (v: string) => onChange({ ...draft, [k]: v });
  return (
    <div className="form">
      <label className="field">
        <span className="field-label">金額（円）</span>
        <input
          className="fk-input field-amount"
          type="number"
          inputMode="numeric"
          min="0"
          required
          value={draft.amount}
          onChange={(e) => set("amount")(e.target.value)}
          placeholder="0"
        />
      </label>
      <div className="field">
        <label className="field-label" htmlFor={`${idPrefix}-category`}>
          カテゴリー
        </label>
        <input
          id={`${idPrefix}-category`}
          className="fk-input"
          list={`${idPrefix}-categories`}
          required
          value={draft.category}
          onChange={(e) => set("category")(e.target.value)}
          placeholder="食費、日用品など"
        />
        <datalist id={`${idPrefix}-categories`}>
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {categories.length > 0 && (
          <div className="chips" role="group" aria-label="よく使うカテゴリー">
            {categories.slice(0, 6).map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                aria-pressed={draft.category === c}
                onClick={() => set("category")(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
      <label className="field">
        <span className="field-label">メモ（なくてもよい）</span>
        <input
          className="fk-input"
          value={draft.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder="品名やお店など"
        />
      </label>
      <label className="field">
        <span className="field-label">使った日</span>
        <input
          className="fk-input"
          type="date"
          required
          value={draft.date}
          onChange={(e) => set("date")(e.target.value)}
        />
      </label>
    </div>
  );
}
