// タブの画面。AppShell が一度開いたものを消さずに持っておく（スクロール位置と中身を残すため）。
// 道筋（router.tsx）には場所だけを書き、中身はここから描く。
import type { ReactNode } from "react";
import { HomeScreen } from "../screens/HomeScreen";
import { JourneyScreen } from "../screens/JourneyScreen";
import { RecordsScreen } from "../screens/RecordsScreen";

export const tabScreens: Record<string, ReactNode> = {
  "/": <HomeScreen />,
  "/records": <RecordsScreen />,
  "/journey": <JourneyScreen />,
};
