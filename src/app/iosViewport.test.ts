import { describe, expect, it } from "vitest";
import { measureBottomShim } from "./iosViewport";

describe("measureBottomShim", () => {
  it("ページが画面よりステータスバーの分だけ短いときは、その差を返す", () => {
    expect(measureBottomShim(852, 793)).toBe(59);
  });
  it("ずれていない・ブラウザのバーで大きく違う・逆向きのときは伸ばさない", () => {
    expect(measureBottomShim(852, 852)).toBe(0);
    expect(measureBottomShim(852, 660)).toBe(0);
    expect(measureBottomShim(852, 900)).toBe(0);
  });
});
