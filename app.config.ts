// アプリごとの設定。
// 雰囲気の違うアプリは src/theme.css で色を上書きする（構造はここでは変えない）。
import type { AppConfig } from "./src/config/types.ts";

const config: AppConfig = {
  name: "貯金のおうち",
  shortName: "貯金のおうち",
  description: "先に貯金を取り分ける、家族の家計簿。今日あといくら使えるかと、貯まっていく様子が分かります",

  // 一番上の画面（どれも「見たい気持ち」で分けてある）
  //   ちょきん：今月の貯金は守れているか・今日あといくら使えるか（買う前に見る）
  //   きろく：何にいくら使ったか（あの支出を確かめる・直す）
  //   あゆみ：これまでにいくら貯まったか（月末に見る）
  tabs: [
    { path: "/", label: "ちょきん", icon: "home" },
    { path: "/records", label: "きろく", icon: "list" },
    { path: "/journey", label: "あゆみ", icon: "chart" },
  ],

  // 端末だけに保存する切り替え。家族で共有する設定（予算・固定費など）は設定画面の
  // アプリ固有の区分（src/settings/ChokinSettings.tsx）に並ぶ。
  settings: [],

  // 書き出し・読み込み・全削除はログイン中の家族のデータが対象なので、
  // 処理は src/data/familyData.ts から設定画面に渡す（ここでは Firebase を読み込まない）。
  hasData: true,

  feedbackUrl: "https://github.com/fukicycle/chokin-no-ouchi/issues",
  license: "© 2025-2026 Fuki Sato",
};

export default config;
