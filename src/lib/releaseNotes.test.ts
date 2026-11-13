import { describe, expect, it } from "vitest";
import { compareVersions, parseReleaseNotes } from "./releaseNotes";

describe("parseReleaseNotes", () => {
  it("版ごとに見出しと箇条書きを読み取る", () => {
    const md = `# リリースノート

## v1.3.0 — 2026-11-02
- 一覧を並び替えられるようになりました
- 暗いテーマで文字が読みにくかったのを直しました

## v1.2.0 - 2026-10-20
* 検索できるようになりました
`;
    expect(parseReleaseNotes(md)).toEqual([
      {
        version: "1.3.0",
        date: "2026-11-02",
        items: ["一覧を並び替えられるようになりました", "暗いテーマで文字が読みにくかったのを直しました"],
      },
      { version: "1.2.0", date: "2026-10-20", items: ["検索できるようになりました"] },
    ]);
  });

  it("日付がなくても読める", () => {
    expect(parseReleaseNotes("## 0.1.0\n- 最初の版")).toEqual([
      { version: "0.1.0", date: "", items: ["最初の版"] },
    ]);
  });
});

describe("compareVersions", () => {
  it("数字として比べる", () => {
    expect(compareVersions("1.10.0", "1.9.9")).toBeGreaterThan(0);
    expect(compareVersions("v1.2.0", "1.2.0")).toBe(0);
    expect(compareVersions("0.1.0", "0.2.0")).toBeLessThan(0);
  });
});
