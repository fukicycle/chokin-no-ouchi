import type { IconName } from "./Icon";
import { Icon } from "./Icon";

/**
 * 右下の主ボタン。いちばん多い「今すぐやりたい」操作に使う（一画面に一つ）。
 * 何が起きるか分かるよう、ふだんは動詞のラベルを添える（例：「追加」「新規作成」）。
 * 中身の上に重なって邪魔になる画面だけ iconOnly にする。
 * スクロールの外に固定され、タブバー・トーストの分だけ上にずれる。
 */
export function Fab({
  label,
  icon = "add",
  iconOnly = false,
  onClick,
}: {
  label: string;
  icon?: IconName;
  iconOnly?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={iconOnly ? "fab fab--icon" : "fab"}
      aria-label={iconOnly ? label : undefined}
      onClick={onClick}
    >
      <Icon name={icon} />
      {!iconOnly && <span className="fab-label">{label}</span>}
    </button>
  );
}
