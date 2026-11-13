# 貯金のおうち

家族で共有できる家計簿（PWA）です。支出を記録して、予算・固定費・使い方の傾向を家族みんなで見られます。

- **ホーム**：今月の支出、予算の残り、1日あたりいくらまで使えるか、カテゴリーの内訳、最近の支出
- **分析**：予算と月末の見込み、前の月・いつもの月との比較、固定費と変動費、支出の推移、曜日・日ごとのパターン
- **履歴**：日ごとの一覧、カテゴリーでの絞り込み、金額順の並び替え、直す・削除（元に戻せる）
- **記録**：手入力、またはレシートの写真から読み取り（Gemini、API キーは各自の端末に保存）
- **固定費**：家賃・サブスクなどを登録すると、毎月自動で記録
- **お知らせ**：その日に記録がなければ夜にお知らせ（Web Push）

[fukicycle/app-template](https://github.com/fukicycle/app-template) から作り、デザインは [fukicycle/design](https://github.com/fukicycle/design) v0.2.0 を使っています。共通の仕組み（設定・通知・新しい版の知らせ方・公開の手順）は雛形の README のとおりです。

## 開発

```bash
npm install
npm run dev     # http://localhost:5173
npm run test
npm run lint
npm run build
```

## 公開（Cloudflare）

タグを打ったときだけ公開します（`.github/workflows/deploy.yml`）。

1. `package.json` の `version` を上げ、`RELEASE_NOTES.md` に同じ版を書く
2. `master` にマージする
3. そのコミットに `v2.0.0` のようなタグを打って push する

初回だけ必要なこと：

- リポジトリの Secrets に `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を登録する
- Firebase コンソール ＞ Authentication ＞ 設定 ＞ 承認済みドメイン に、公開先のドメイン（`chokin-no-ouchi.<アカウント>.workers.dev` など）を足す（足さないと Google でログインできない）
- `firebase deploy --only database` でデータベースのルール（`database.rules.json`）を反映する

入力忘れのお知らせは `daily-reminder.yml` が毎晩動きます（Secrets：`FIREBASE_SERVICE_ACCOUNT`・`VAPID_PUBLIC_KEY`・`VAPID_PRIVATE_KEY`。v1 と同じ）。

## ライセンス

© 2025-2026 Fuki Sato
