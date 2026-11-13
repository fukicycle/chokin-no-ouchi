// 数字が変わったとき（月を送ったときなど）、前の値から新しい値へ短く数え上げる。
// 最初に出すときは動かさない。動きを減らす設定の端末ではすぐ新しい値にする。
import { useEffect, useRef, useState } from "react";

const DURATION = 420;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export function useAnimatedNumber(value: number) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (start === value || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - t0) / DURATION);
      setShown(start + (value - start) * easeOut(t));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return shown;
}
