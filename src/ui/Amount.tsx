// 金額の表示。値が変わると、前の値から新しい値へ短く数え上げる（記録した手応えになる）。
// 読み込みの間は同じ大きさの薄い面を置いておき、届いたときにまわりが動かないようにする。
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
        ¥00,000
      </span>
    );
  }
  return (
    <span className={className} aria-label={formatSignedYen(value)}>
      {formatSignedYen(shown)}
    </span>
  );
}
