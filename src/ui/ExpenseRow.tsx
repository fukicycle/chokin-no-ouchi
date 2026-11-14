// 支出の1行。押すと、その記録を直すシートが開く（間違いに気づくのは一覧を見ているときなので、行そのものを入口にする）。
// 高さは決めてあるので、メモの有無で行がずれない。
import type { Expense } from "../data/types";
import { useEntry } from "../entry/EntryProvider";
import { formatYen } from "../lib/format";

export function ExpenseRow({ expense }: { expense: Expense }) {
  const { openEdit } = useEntry();
  const note = [expense.isFixed ? "固定費" : null, expense.description].filter(Boolean).join("・");
  return (
    <li>
      <button className="expense" onClick={() => openEdit(expense)}>
        <span className="expense-main">
          <span className="expense-category">{expense.category}</span>
          {note && <span className="expense-note">{note}</span>}
        </span>
        <span className="expense-amount">{formatYen(expense.amount)}</span>
      </button>
    </li>
  );
}
