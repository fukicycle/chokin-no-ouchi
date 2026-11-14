// 支出の1行。押すと、その記録を直すシートが開く（間違いに気づくのは一覧を見ているときなので、行そのものを入口にする）。
// 押せる行だと分かるよう、右端に「進む」の印を置き、押している間は行が沈む。
// 高さは決めてあるので、メモの有無で行がずれない。
import type { Expense } from "../data/types";
import { useEntry } from "../entry/EntryProvider";
import { formatYen } from "../lib/format";
import { Icon } from "./Icon";

export function ExpenseRow({ expense }: { expense: Expense }) {
  const { openEdit } = useEntry();
  const note = [expense.isFixed ? "固定費" : null, expense.description].filter(Boolean).join("・");
  return (
    <li>
      <button className="expense" onClick={() => openEdit(expense)}>
        <span className="expense-main">
          <span className="expense-category">
            {expense.category}
            {expense.isSpecial && <span className="tag">特別費</span>}
          </span>
          {note && <span className="expense-note">{note}</span>}
        </span>
        <span className="expense-amount">{formatYen(expense.amount)}</span>
        <Icon name="forward" size="sm" className="row-go" />
      </button>
    </li>
  );
}
