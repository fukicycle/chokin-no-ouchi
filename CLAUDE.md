# CLAUDE.md

<!-- デザインのルール（design を更新すると一緒に更新される） -->

@node_modules/@fukicycle/design/DESIGN.md

## このアプリについて

- **名前**：貯金のおうち（v2。v1 は React + Tailwind で GitHub Pages に公開していた）
- **何をするアプリか（1文）**：家族で共有する家計簿。支出を記録し、予算・固定費・傾向を見て使いすぎを防ぐ
- **使う人と、使う場面**：同じ家に住む家族。買い物の直後（レシートを撮る・手で入れる）と、月の途中・月末の振り返り
- **一番よく行う操作**：支出を記録する（→ どのタブでも右下の［記録する］）
- **公開先**：https://chokin.kotli-sharp.jp（Cloudflare Workers のカスタムドメイン。`wrangler.jsonc`）
- **扱うデータと保存先**：Firebase Realtime Database（v1 と同じプロジェクト）。`users/{uid}`（家族 ID・通知の購読）、`expenses/{familyId}`、`fixedCosts/{familyId}`、`budgets/{familyId}`。ルールは `database.rules.json`（`firebase deploy --only database` で反映）。Gemini の API キーとモデルは端末（localStorage）だけ
- **このアプリだけの決め事**：
  - 画面は ホーム（`/`）・分析（`/insights`）・履歴（`/history`）の3タブ。見ている期間（月・年）は `src/data/period.tsx` で3タブ共通
  - 固定費は `fixedCosts` のひな形から毎月自動で支出に記録する（`src/data/hooks.ts` の `useFixedCostSync`、計算は `src/lib/fixedCosts.ts`）。キーを `fixed_{id}_{YYYY-MM}` にして、家族の複数端末が同時に動いても二重に記録しない
  - 集計の計算は `src/lib/analytics.ts` に置き、テストを書く。月末の見込みは「固定費＋変動費を今日までのペースで伸ばしたもの」
  - 設定のアプリ固有の区分は `src/settings/chokin/`（予算・固定費・カテゴリーの整理・レシート・入力忘れのお知らせ・家族・ログアウト）
  - 入力忘れのお知らせは GitHub Actions（`daily-reminder.yml`）が毎晩 `scripts/send-reminders.cjs` を動かして Web Push で送る。受け取りは `public/push-sw.js`
  - design は v0.2.0（色を持たない版）。色は `src/theme.css`、アプリの画面の見た目は `src/screens.css`

## 共通の決め事（変えない）

- 設定はどの画面でもトップバー右上の歯車から開く。設定画面の区分と並び順は変えない。アプリ固有の項目は `app.config.ts` の `settings` に足す
- 通知（風鈴）はトップバー右上、設定の左に常に置く。未読は朱の点だけで示し、数字は出さない
- 新しい版は自動で切り替えない。バナーやポップアップも出さない。新しい版のお知らせは通知一覧に届け、通知か「設定 ＞ このアプリについて」でユーザーが［更新する］を押したときだけ切り替える
- アプリの一番外側はスクロールさせない。スクロールは中身の領域（`.shell-main`、`.fk-scroll`）だけ
- 色・文字・余白は `--fk-*` の CSS 変数だけを使う。design の値はこのリポジトリで書き換えない。雰囲気を変えるときは `src/theme.css` で上書きする
- アイコンは design のものを使う。足りないときは流用せず、design リポジトリに足すことを提案する
- 公開はタグ（`v1.2.0`）を push したときだけ。`master` へのマージは CI だけ。タグ・`package.json` の `version`・`RELEASE_NOTES.md` の版は必ずそろえる（そろっていないと公開されない）。タグは、ユーザーに頼まれたときだけ打つ
- 変更を公開するときは `RELEASE_NOTES.md` に版を足し、`package.json` の `version` とそろえる。使う人の言葉で「何ができるようになったか・何が直ったか」を書き、内部の変更は書かない（通知・設定・`version.json` にそのまま出る）

## 画面を作るとき

画面やボタンを置く前に「どこに置くか」「ユーザーはどんな動機で押すか」を考え、結論を短く説明してから実装する（詳しくは DESIGN.md の 0 と 6）。

## 開発環境

`.devcontainer/` の設定（Node.js 22、Claude Code、gh、Wrangler）が正。コンテナの外で作業するときも、この版と道具に合わせる。

## コマンド

```bash
npm run dev       # 開発サーバー
npm run build     # 本番ビルド
npm run test      # テスト
npm run lint      # 検査
```
