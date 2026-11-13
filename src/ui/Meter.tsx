// 予算の消化などの割合。沈んだ受け皿に、差し色で満ちていく。超えたらエラーの色に変える（文言でも伝える）。
export function Meter({ ratio, label }: { ratio: number; label: string }) {
  const over = ratio > 1;
  return (
    <div
      className="meter"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
    >
      <span
        className={over ? "meter-fill meter-fill--over" : "meter-fill"}
        style={{ width: `${Math.min(ratio, 1) * 100}%` }}
      />
    </div>
  );
}
