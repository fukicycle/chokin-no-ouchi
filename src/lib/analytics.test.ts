import { describe, expect, it } from "vitest";
import {
  averageOfMonths,
  categoryMoves,
  dailyAllowance,
  formatYenAxis,
  projectMonthTotal,
  spendingPattern,
  totalsByMonth,
} from "./analytics";
import { buildFixedExpense, fixedExpenseDate, pendingMonths } from "./fixedCosts";
import { addMonths, monthProgress } from "./months";

const e = (amount: number, date: Date, extra: object = {}) => ({
  id: String(Math.random()),
  amount,
  category: "食費",
  date: date.toISOString(),
  ...extra,
});

describe("months", () => {
  it("年をまたいで足し引きできる", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
  it("進行中の月の経過日数", () => {
    const today = new Date(2026, 8, 10);
    expect(monthProgress(2026, 9, today)).toEqual({ days: 30, elapsed: 10, inProgress: true });
    expect(monthProgress(2026, 8, today)).toEqual({ days: 31, elapsed: 31, inProgress: false });
    expect(monthProgress(2026, 10, today).elapsed).toBe(0);
  });
});

describe("fixedCosts", () => {
  it("未計上の月を古い順に、最大12ヶ月さかのぼる", () => {
    expect(pendingMonths("2026-08", "2026-09")).toEqual(["2026-09"]);
    expect(pendingMonths("2026-09", "2026-09")).toEqual([]);
    expect(pendingMonths(undefined, "2026-09")).toEqual(["2026-09"]);
    expect(pendingMonths("2025-11", "2026-01")).toEqual(["2025-12", "2026-01"]);
    const long = pendingMonths("2020-01", "2026-09");
    expect(long).toHaveLength(12);
    expect(long[0]).toBe("2025-10");
  });
  it("支払日は月の日数に丸める", () => {
    expect(new Date(fixedExpenseDate("2026-02", 31)).getDate()).toBe(28);
    expect(new Date(fixedExpenseDate("2026-09", 1)).getDate()).toBe(1);
  });
  it("固定費の支出には印が付く", () => {
    const x = buildFixedExpense(
      { id: "a", name: "家賃", category: "住居費", amount: 80000, dayOfMonth: 27 },
      "2026-09",
      "u1",
    );
    expect(x).toMatchObject({
      amount: 80000,
      description: "家賃",
      isFixed: true,
      fixedCostId: "a",
      userId: "u1",
    });
  });
});

describe("analytics", () => {
  it("着地予測は固定費を日割りで伸ばさない", () => {
    const today = new Date(2026, 8, 10); // 9月10日（30日の月）
    // 固定費 80,000 + 変動費 10,000（10日分）→ 80,000 + 30,000
    expect(projectMonthTotal(90000, 80000, 2026, 9, today)).toBe(110000);
    expect(projectMonthTotal(90000, 80000, 2026, 8, today)).toBeNull();
  });
  it("1日あたり使える額は今日を含めた残り日数で割る", () => {
    const today = new Date(2026, 8, 21);
    expect(dailyAllowance(100000, 50000, 2026, 9, today)).toEqual({
      remainingDays: 10,
      remaining: 50000,
      perDay: 5000,
    });
    expect(dailyAllowance(100000, 120000, 2026, 9, today)?.perDay).toBe(0);
    expect(dailyAllowance(100000, 0, 2026, 8, today)).toBeNull();
    expect(dailyAllowance(0, 0, 2026, 9, today)).toBeNull();
  });
  it("平均は支出のあった月だけで計算する", () => {
    const totals = totalsByMonth([e(100, new Date(2026, 6, 3)), e(300, new Date(2026, 7, 3))]);
    expect(averageOfMonths(["2026-06", "2026-07", "2026-08"], totals)).toEqual({ value: 200, months: 2 });
    expect(averageOfMonths(["2026-01"], totals)).toBeNull();
  });
  it("カテゴリーの増減", () => {
    const now = new Date();
    const { increases, decreases } = categoryMoves(
      [e(500, now), e(100, now, { category: "外食" })],
      [e(200, now), e(400, now, { category: "外食" }), e(50, now, { category: "趣味" })],
    );
    expect(increases.map((m) => [m.category, m.diff])).toEqual([["食費", 300]]);
    expect(decreases.map((m) => m.category)).toEqual(["外食", "趣味"]);
  });
  it("支出のパターンは固定費を除き、今日までで数える", () => {
    const today = new Date(2026, 8, 3, 18);
    const p = spendingPattern(
      [
        e(1000, new Date(2026, 8, 1, 12)),
        e(80000, new Date(2026, 8, 2, 12), { isFixed: true }),
        e(500, new Date(2026, 8, 10, 12)),
      ],
      new Date(2026, 8, 1),
      new Date(2026, 8, 30, 23, 59),
      today,
    );
    expect(p.elapsedDays).toBe(3);
    expect(p.noSpendDays).toBe(2);
    expect(p.peak?.total).toBe(1000);
  });
  it("軸は1万円以上を万で表す", () => {
    expect(formatYenAxis(150000)).toBe("15万");
    expect(formatYenAxis(8000)).toBe("8,000");
  });
});
