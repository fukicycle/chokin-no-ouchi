import { createBrowserRouter } from "react-router";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { InsightsScreen } from "../screens/InsightsScreen";
import { BudgetScreen } from "../settings/chokin/BudgetScreen";
import { CategoriesScreen } from "../settings/chokin/CategoriesScreen";
import { FamilyScreen } from "../settings/chokin/FamilyScreen";
import { FixedCostsScreen } from "../settings/chokin/FixedCostsScreen";
import { ReceiptSettingsScreen } from "../settings/chokin/ReceiptSettingsScreen";
import { LicensesScreen } from "../settings/LicensesScreen";
import { ReleaseNotesScreen } from "../settings/ReleaseNotesScreen";
import { SettingsScreen } from "../settings/SettingsScreen";
import { AppShell, type RouteHandle } from "./AppShell";

const h = (title: string): RouteHandle => ({ title });

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      // アプリの画面（タブは app.config.ts の tabs）
      { path: "/", element: <HomeScreen /> },
      { path: "/insights", element: <InsightsScreen /> },
      { path: "/history", element: <HistoryScreen /> },

      // 設定 ＞ 貯金のおうち（アプリ固有の区分から開く画面）
      { path: "/settings/budget", element: <BudgetScreen />, handle: h("月の予算") },
      { path: "/settings/fixed-costs", element: <FixedCostsScreen />, handle: h("固定費") },
      { path: "/settings/categories", element: <CategoriesScreen />, handle: h("カテゴリーの整理") },
      { path: "/settings/family", element: <FamilyScreen />, handle: h("家族で共有") },
      { path: "/settings/receipt", element: <ReceiptSettingsScreen />, handle: h("レシートの読み取り") },

      // 共通の画面（変えない）
      { path: "/settings", element: <SettingsScreen />, handle: h("設定") },
      { path: "/settings/release-notes", element: <ReleaseNotesScreen />, handle: h("リリースノート") },
      { path: "/settings/licenses", element: <LicensesScreen />, handle: h("ライセンス") },
    ],
  },
]);
