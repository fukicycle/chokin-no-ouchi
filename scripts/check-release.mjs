// 版番号の食い違いを止める。
//   node scripts/check-release.mjs            … package.json の版のリリースノートがあるか
//   node scripts/check-release.mjs v1.2.0     … さらに、タグが package.json の版と同じか
// GitHub Actions でタグから動いたときは、引数が無くてもそのタグ（GITHUB_REF_NAME）を使う。
import { readFileSync } from "node:fs";

const fail = (msg) => {
  console.error(`::error::${msg}`);
  process.exit(1);
};

const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const tag =
  process.argv[2] ?? (process.env.GITHUB_REF_TYPE === "tag" ? process.env.GITHUB_REF_NAME : undefined);

if (tag !== undefined && tag !== `v${version}`) {
  fail(
    `タグ ${tag} と package.json の version（${version}）が違います。` +
      `package.json の version を ${tag.replace(/^v/, "")} にして master に入れてから、そのコミットにタグを打ち直してください。`,
  );
}

// RELEASE_NOTES.md の "## v1.2.0 — 2026-11-05" と、その下の "- " の行
const md = readFileSync("RELEASE_NOTES.md", "utf8");
let found = false;
let items = 0;
for (const line of md.split(/\r?\n/).map((l) => l.trim())) {
  const h = /^##\s+v?(\d+\.\d+\.\d+)/.exec(line);
  if (h) {
    if (found) break;
    found = h[1] === version;
    continue;
  }
  if (found && /^[-*]\s+/.test(line)) items++;
}
if (!found) fail(`RELEASE_NOTES.md に v${version} の項目がありません。使う人の言葉で書き足してください。`);
if (items === 0) fail(`RELEASE_NOTES.md の v${version} に箇条書きがありません。`);

console.log(`v${version}：リリースノート ${items} 件${tag ? `、タグ ${tag} と一致` : ""}`);
