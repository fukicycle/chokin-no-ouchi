// 金額の表示。値が変わると、前の値から新しい値へ短く数え上げる（記録した手応えになる）。
// 読み込みの間は同じ大きさの薄い面を置いておき、届いたときにまわりが動かないようにする。
// ¥ は数字より小さく添える（通帳の記帳のように、読むのは数字。.yen）。
import { formatSignedYen } from "../lib/format";
import { useAnimatedNumber } from "./useAnimatedNumber";

export function Amount({
  value,
  loading = false,
  className,
}: {
  value: number;
  loading?: boolean;
  className?: string;
}) {
  const shown = useAnimatedNumber(value);
  if (loading) {
    return (
      <span className={className ? `${className} amount-wait` : "amount-wait"} aria-hidden="true">
        <span className="yen">¥</span>00,000
      </span>
    );
  }
  const n = Math.round(shown);
  return (
    <span className={className} aria-label={formatSignedYen(value)}>
      {n < 0 && "−"}
      <span className="yen">¥</span>
      {Math.abs(n).toLocaleString("ja-JP")}
    </span>
  );
}
