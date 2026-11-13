// 金額の横棒（カテゴリーの内訳など）。棒は差し色ひとつ。金額と割合は文字の色で添える。
import { formatYen } from "../lib/analytics";

export type BarItem = { key: string; label: string; amount: number; note?: string };

export function Bars({
  items,
  max,
  onSelect,
}: {
  items: BarItem[];
  max?: number;
  onSelect?: (key: string) => void;
}) {
  const top = max ?? Math.max(1, ...items.map((i) => i.amount));
  return (
    <ul className="bars">
      {items.map((i) => {
        const body = (
          <>
            <span className="bars-head">
              <span className="bars-label">{i.label}</span>
              <span className="bars-value">
                {formatYen(i.amount)}
                {i.note && <span className="bars-note">{i.note}</span>}
              </span>
            </span>
            <span className="bars-track">
              <span className="bars-fill" style={{ width: `${(i.amount / top) * 100}%` }} />
            </span>
          </>
        );
        return (
          <li key={i.key}>
            {onSelect ? (
              <button className="bars-item bars-item--link" onClick={() => onSelect(i.key)}>
                {body}
              </button>
            ) : (
              <div className="bars-item">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
