# 貯金のおうち

先に貯金を取り分ける、家族で共有する家計簿（PWA）です。月の手取りと毎月貯めたい額を決めると、残りを「使えるお金」として数えます。

- **ちょきん**：今月の貯金が守れているか、今日あといくら使えるか、今日の記録
- **きろく**：月ごと・日ごとの支出。カテゴリーで絞り込み、行を押して直す・削除（元に戻せる）
- **あゆみ**：これまでに貯まったお金、月ごとの結果（計画を立てた月から数える）、この12ヶ月の使ったお金の推移
- **特別費**：車検・結婚式などは印を付けて記録すると、使えるお金には数えない
- **記録する**：どの画面でも右下から。テンキーで金額、カテゴリーを押すだけ。レシートの写真から読み取りも（Gemini、API キーは各自の端末に保存）
- **固定費**：家賃・サブスクなどを登録すると、毎月自動で記録
- **お知らせ**：その日に記録がなければ夜にお知らせ（Web Push）

Firebase のデータは v1・v2 と同じ場所をそのまま使います（足したのは `budgets/{familyId}/plans` と、支出の `isSpecial` だけ）。

[fukicycle/app-template](https://github.com/fukicycle/app-template) から作り、デザインは [fukicycle/design](https://github.com/fukicycle/design) v0.3.2 を使っています。共通の仕組み（設定・通知・新しい版の知らせ方・公開の手順）は雛形の README のとおりです。

## 開発

```bash
npm install
npm run dev     # http://localhost:5173
npm run test
npm run lint
npm run build
```

## 公開（Cloudflare）

公開先は **https://chokin.kotli-sharp.jp** です（`wrangler.jsonc` の `routes`。kotli-sharp.jp の DNS は Cloudflare で管理しているので、公開時に DNS レコードと証明書が自動で作られます）。

タグを打ったときだけ公開します（`.github/workflows/deploy.yml`）。

1. `package.json` の `version` を上げ、`RELEASE_NOTES.md` に同じ版を書く
2. `master` にマージする
3. そのコミットに `v3.0.0` のようなタグを打って push する

初回だけ必要なこと：

- リポジトリの Secrets に `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を登録する
- Firebase コンソール ＞ Authentication ＞ 設定 ＞ 承認済みドメイン に `chokin.kotli-sharp.jp` を足す（足さないと Google でログインできない）
- `firebase deploy --only database` でデータベースのルール（`database.rules.json`）を反映する

入力忘れのお知らせは `daily-reminder.yml` が毎晩動きます（Secrets：`FIREBASE_SERVICE_ACCOUNT`・`VAPID_PUBLIC_KEY`・`VAPID_PRIVATE_KEY`。v1 と同じ）。

## ライセンス

© 2025-2026 Fuki Sato
