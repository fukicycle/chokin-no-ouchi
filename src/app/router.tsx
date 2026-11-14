import { createBrowserRouter, Navigate } from "react-router";
import { CategoriesScreen } from "../settings/chokin/CategoriesScreen";
import { FamilyScreen } from "../settings/chokin/FamilyScreen";
import { FixedCostsScreen } from "../settings/chokin/FixedCostsScreen";
import { PlanScreen } from "../settings/chokin/PlanScreen";
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
      // タブの画面（app.config.ts の tabs）。中身は AppShell が src/app/tabScreens.tsx から描いて持っておく
      { path: "/", element: null },
      { path: "/records", element: null },
      { path: "/journey", element: null },

      // 設定 ＞ 貯金のおうち（アプリ固有の区分から開く画面）
      { path: "/settings/plan", element: <PlanScreen />, handle: h("貯金の計画") },
      { path: "/settings/fixed-costs", element: <FixedCostsScreen />, handle: h("固定費") },
      { path: "/settings/categories", element: <CategoriesScreen />, handle: h("カテゴリーの整理") },
      { path: "/settings/family", element: <FamilyScreen />, handle: h("家族で共有") },
      { path: "/settings/receipt", element: <ReceiptSettingsScreen />, handle: h("レシートの読み取り") },

      // 共通の画面（変えない）
      { path: "/settings", element: <SettingsScreen />, handle: h("設定") },
      { path: "/settings/release-notes", element: <ReleaseNotesScreen />, handle: h("リリースノート") },
      { path: "/settings/licenses", element: <LicensesScreen />, handle: h("ライセンス") },

      // 前の版（v2）の場所や、無い場所を開いたときは最初の画面へ
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
