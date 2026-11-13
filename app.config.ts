// アプリごとの設定。
// 雰囲気の違うアプリは src/theme.css で色を上書きする（構造はここでは変えない）。
import type { AppConfig } from "./src/config/types.ts";

const config: AppConfig = {
  name: "貯金のおうち",
  shortName: "貯金のおうち",
  description: "家族で共有できる家計簿。レシートの読み取り、固定費の自動計上、支出の分析ができます",

  // 一番上の画面：ホーム（今月いくら使ったか）・分析（振り返り）・履歴（記録の一覧）
  tabs: [
    { path: "/", label: "ホーム", icon: "wallet" },
    { path: "/insights", label: "分析", icon: "chart" },
    { path: "/history", label: "履歴", icon: "list" },
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
