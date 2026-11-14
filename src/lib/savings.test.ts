import { describe, expect, it } from "vitest";
import {
  journey,
  monthResult,
  planFor,
  spendingTrend,
  startMonth,
  todayAllowance,
  totalSaved,
  totalSpecial,
} from "./savings";

const plans = { "2026-11": { income: 300000, goal: 50000 }, "2027-02": { income: 320000, goal: 80000 } };
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).toISOString();

describe("計画", () => {
  it("いちばん古い計画の月から数え始める", () => {
    expect(startMonth(plans)).toBe("2026-11");
    expect(startMonth({})).toBeNull();
  });
  it("その月以前でいちばん新しい計画を使う。数え始めより前は無い", () => {
    expect(planFor(plans, "2026-10")).toBeNull();
    expect(planFor(plans, "2027-01")).toEqual(plans["2026-11"]);
    expect(planFor(plans, "2027-02")).toEqual(plans["2027-02"]);
    expect(planFor(plans, "2028-05")).toEqual(plans["2027-02"]);
  });
});

describe("月の結果", () => {
  it("使えるお金の中なら、貯金は目標のまま守られる", () => {
    const r = monthResult({ income: 300000, goal: 50000 }, 200000);
    expect(r).toMatchObject({ budget: 250000, left: 50000, over: 0, kept: 50000, saved: 100000 });
  });
  it("使いすぎた分は貯金に食い込む", () => {
    const r = monthResult({ income: 300000, goal: 50000 }, 262000);
    expect(r).toMatchObject({ left: 0, over: 12000, kept: 38000, saved: 38000 });
  });
  it("手取りより多く使えばマイナスになる", () => {
    expect(monthResult({ income: 300000, goal: 50000 }, 310000).saved).toBe(-10000);
  });
});

describe("今日あといくら", () => {
  const today = new Date(2026, 10, 21, 9); // 11月は30日。21日なら残り10日
  it("今朝の残りを残りの日数で割り、今日使った分を引く", () => {
    const a = todayAllowance(
      100000,
      [
        { amount: 60000, date: at(2026, 11, 1), isFixed: true },
        { amount: 20000, date: at(2026, 11, 10) },
        { amount: 500, date: at(2026, 11, 21) },
      ],
      today,
    );
    expect(a).toMatchObject({ daysLeft: 10, perDay: 2000, spentToday: 500, leftToday: 1500, overToday: 0 });
    expect(a.nextPerDay).toBe(Math.floor(19500 / 9));
  });
  it("今日の分をこえたら 0。こえた額と、明日からの額を出す", () => {
    const a = todayAllowance(
      100000,
      [
        { amount: 80000, date: at(2026, 11, 5) },
        { amount: 2900, date: at(2026, 11, 21) },
      ],
      today,
    );
    expect(a).toMatchObject({ perDay: 2000, leftToday: 0, overToday: 900, nextPerDay: 1900 });
  });
  it("先の日付で記録された今月の固定費は、今日の分に数えない", () => {
    const a = todayAllowance(100000, [{ amount: 30000, date: at(2026, 11, 21), isFixed: true }], today);
    expect(a).toMatchObject({ perDay: 7000, spentToday: 0, leftToday: 7000 });
  });
  it("特別費は今日の分にも、使えるお金にも数えない", () => {
    const a = todayAllowance(
      100000,
      [
        { amount: 150000, date: at(2026, 11, 21), isSpecial: true },
        { amount: 500, date: at(2026, 11, 21) },
      ],
      today,
    );
    expect(a).toMatchObject({ perDay: 10000, spentToday: 500, leftToday: 9500 });
  });
  it("月末は明日からの額が無い", () => {
    expect(todayAllowance(1000, [], new Date(2026, 10, 30)).nextPerDay).toBeNull();
  });
});

describe("あゆみ", () => {
  it("数え始めから今月までを新しい順に。貯まった額は締まった月だけ足す", () => {
    const months = journey(
      plans,
      [
        { amount: 240000, date: at(2026, 11, 3) },
        { amount: 260000, date: at(2026, 12, 3) },
        { amount: 100000, date: at(2027, 1, 3) },
        { amount: 999999, date: at(2026, 10, 3) }, // 数え始めより前は数えない
      ],
      new Date(2027, 0, 15),
    );
    expect(months.map((m) => m.month)).toEqual(["2027-01", "2026-12", "2026-11"]);
    expect(months.map((m) => m.closed)).toEqual([false, true, true]);
    expect(months[1].result).toMatchObject({ over: 10000, saved: 40000 });
    expect(totalSaved(months)).toBe(60000 + 40000);
  });
  it("特別費は月の結果に数えず、これまでに貯まった額からは引く", () => {
    const months = journey(
      plans,
      [
        { amount: 240000, date: at(2026, 11, 3) },
        { amount: 120000, date: at(2026, 11, 20), isSpecial: true },
      ],
      new Date(2026, 11, 15),
    );
    expect(months[1]).toMatchObject({ month: "2026-11", special: 120000 });
    expect(months[1].result).toMatchObject({ over: 0, kept: 50000, saved: 60000 });
    expect(totalSpecial(months)).toBe(120000);
    expect(totalSaved(months)).toBe(60000 - 120000);
  });
  it("推移は今月までを古い順に。計画より前の月も、特別費も分けて出す", () => {
    const trend = spendingTrend(
      [
        { amount: 1000, date: at(2026, 9, 3) },
        { amount: 2000, date: at(2026, 11, 3) },
        { amount: 500, date: at(2026, 11, 4), isSpecial: true },
      ],
      3,
      new Date(2026, 10, 15),
    );
    expect(trend).toEqual([
      { month: "2026-09", normal: 1000, special: 0 },
      { month: "2026-10", normal: 0, special: 0 },
      { month: "2026-11", normal: 2000, special: 500 },
    ]);
  });
  it("計画がなければ空", () => {
    expect(journey({}, [])).toEqual([]);
  });
});
