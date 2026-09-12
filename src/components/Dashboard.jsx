// src/components/Dashboard.jsx
import React, { useState, useMemo } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { useUserData } from "../hooks/useUserData";
import { useMonthlyExpenses } from "../hooks/useMonthlyExpenses";
import { useRecentExpenses } from "../hooks/useRecentExpenses";
import { useAnnualExpenses } from "../hooks/useAnnualExpenses";
import { useBudget } from "../hooks/useBudget";
import { useTheme } from "../context/ThemeContext";
import Modal from "./Modal";
import ExpenseForm from "./ExpenseForm";
import ReceiptScanForm from "./ReceiptScanForm";
import BottomNav from "./BottomNav";
import HomeView from "./HomeView";
import InsightsView from "./InsightsView";
import HistoryView from "./HistoryView";
import SettingsView from "./SettingsView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home"); // "home" | "insights" | "history" | "settings"
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [addMode, setAddMode] = useState("manual"); // "manual" または "receipt"
  const [viewMode, setViewMode] = useState("month"); // "month" または "year"
  const [initialCategoryFilter, setInitialCategoryFilter] = useState("all"); // 履歴タブの初期カテゴリーフィルター

  const { currentUser } = useAuth();
  const { userData, loading: userLoading } = useUserData();
  const { theme, toggleTheme } = useTheme();

  const familyId = !userLoading && userData ? userData.familyId : undefined;
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const { monthlyBudget } = useBudget(familyId);

  // 今月の支出データ取得
  const { expenses, loading: expensesLoading } = useMonthlyExpenses(
    familyId,
    currentYear,
    currentMonth
  );

  // 前月の年月算出と支出データ取得（前月比計算用）
  const { prevYear, prevMonth } = useMemo(() => {
    const d = new Date(currentYear, currentMonth - 2, 1);
    return { prevYear: d.getFullYear(), prevMonth: d.getMonth() + 1 };
  }, [currentYear, currentMonth]);

  const { expenses: prevExpenses, loading: prevExpensesLoading } = useMonthlyExpenses(
    familyId,
    prevYear,
    prevMonth
  );

  // 選択年の累計支出額・全支出明細の取得
  const { annualExpenses, annualTotal, loading: annualLoading } = useAnnualExpenses(
    familyId,
    currentYear
  );

  // 前年の累計支出額・全支出明細の取得 (前年比・カテゴリー伸び率計算用)
  const {
    annualExpenses: prevYearExpenses,
    annualTotal: prevYearTotal,
    loading: prevYearLoading,
  } = useAnnualExpenses(familyId, currentYear - 1);

  // 直近3ヶ月の推移データ取得 (月次用)
  const { data: trendData } = useRecentExpenses(familyId, 3);

  // 月名・ヘッダー表示用
  const monthName = useMemo(() => {
    const date = new Date(currentYear, currentMonth - 1);
    return date.toLocaleString("ja-JP", { year: "numeric", month: "long" });
  }, [currentYear, currentMonth]);

  // モードに応じたデータの出し分け
  const chartExpenses = useMemo(() => {
    return viewMode === "month" ? expenses : annualExpenses;
  }, [viewMode, expenses, annualExpenses]);

  // カテゴリー伸び率比較用の前期データ
  const previousPeriodExpenses = useMemo(() => {
    return viewMode === "month" ? prevExpenses : prevYearExpenses;
  }, [viewMode, prevExpenses, prevYearExpenses]);

  const displayTotal = useMemo(() => {
    return viewMode === "month"
      ? expenses.reduce((sum, e) => sum + e.amount, 0)
      : annualTotal;
  }, [viewMode, expenses, annualTotal]);

  const recentExpenses = useMemo(() => {
    return chartExpenses.slice(0, 5);
  }, [chartExpenses]);

  // 比較情報の計算
  const comparisonData = useMemo(() => {
    if (viewMode === "month") {
      const currentTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
      const prevTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        label: "前月合計",
        prevTotal,
        diff: currentTotal - prevTotal,
        diffLabel: "前月差",
        subLabel: currentTotal - prevTotal > 0 ? "増加" : currentTotal - prevTotal < 0 ? "節約" : "差額なし",
      };
    } else {
      return {
        label: "前年合計",
        prevTotal: prevYearTotal,
        diff: annualTotal - prevYearTotal,
        diffLabel: "前年差",
        subLabel: annualTotal - prevYearTotal > 0 ? "増加" : annualTotal - prevYearTotal < 0 ? "節約" : "差額なし",
      };
    }
  }, [viewMode, expenses, prevExpenses, annualTotal, prevYearTotal]);

  // 12ヶ月の推移データの集計 (年次用)
  const yearlyTrendData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: `${currentYear}-${String(i + 1).padStart(2, "0")}`,
      total: 0,
    }));

    annualExpenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      const m = expDate.getMonth(); // 0 to 11
      months[m].total += exp.amount || 0;
    });

    return months;
  }, [annualExpenses, currentYear]);

  // トレンドデータの出し分け
  const activeTrendData = useMemo(() => {
    return viewMode === "month" ? trendData : yearlyTrendData;
  }, [viewMode, trendData, yearlyTrendData]);

  // ナビゲーション処理
  const handlePrevious = () => {
    if (viewMode === "month") {
      const newDate = new Date(currentYear, currentMonth - 2);
      setCurrentYear(newDate.getFullYear());
      setCurrentMonth(newDate.getMonth() + 1);
    } else {
      setCurrentYear((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      const newDate = new Date(currentYear, currentMonth);
      setCurrentYear(newDate.getFullYear());
      setCurrentMonth(newDate.getMonth() + 1);
    } else {
      setCurrentYear((prev) => prev + 1);
    }
  };

  const isNextDisabled = useMemo(() => {
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    if (viewMode === "month") {
      return (
        currentYear > todayYear ||
        (currentYear === todayYear && currentMonth >= todayMonth)
      );
    } else {
      return currentYear >= todayYear;
    }
  }, [viewMode, currentYear, currentMonth]);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const goToHistoryWithCategory = (categoryName) => {
    setInitialCategoryFilter(categoryName);
    setActiveTab("history");
  };

  if (!currentUser || userLoading) {
    return (
      <div className="flex items-center justify-center h-full text-xl font-bold text-slate-700 dark:text-slate-200">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="app-shell relative transition-colors duration-300 text-slate-800 dark:text-gray-100">
      {/* Glassmorphism v2: メッシュグラデーション背景 */}
      <div className="mesh-bg">
        <span className="blob-1" />
        <span className="blob-2" />
        <span className="blob-3" />
        <span className="blob-4" />
      </div>

      {/* 簡略化された固定ヘッダー: ブランド + 月/年ナビゲーター + ダークモード切替
          app-shellがoverflow:hiddenなので、ここはsticky不要でも常に画面上部に静止する */}
      <header className="relative z-30 shrink-0 bg-white/30 dark:bg-black/20 backdrop-blur-xl border-b border-white/40 dark:border-white/10 shadow-md px-4 sm:px-6 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-extrabold tracking-widest text-cyan-800 dark:text-cyan-400 uppercase">
              CHOKIN NO OUCHI
            </span>
            <h2 className="text-base font-black text-slate-800 dark:text-white truncate max-w-[160px] sm:max-w-xs">
              {userData?.displayName || "メンバー"}さん 👋
            </h2>
          </div>

          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-cyan-800 dark:text-cyan-400 bg-white/50 dark:bg-black/25 border border-cyan-800/20 dark:border-white/10 rounded-full shadow-sm hover:scale-105 active:scale-[0.95] transition-all duration-200"
            title={theme === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え"}
          >
            <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} className="text-base" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center justify-between bg-white/40 dark:bg-black/25 border border-white/50 dark:border-white/10 rounded-2xl p-1 shadow-sm flex-1 max-w-[220px]">
            <button
              onClick={handlePrevious}
              className="p-1.5 text-cyan-800 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors duration-200 rounded-xl hover:bg-white/40 dark:hover:bg-black/10"
              title={viewMode === "month" ? "前月" : "前年"}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
            </button>
            <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white text-center flex-grow tracking-tight">
              {viewMode === "month" ? monthName : `${currentYear}年`}
            </h3>
            <button
              onClick={handleNext}
              disabled={isNextDisabled}
              className={`p-1.5 text-cyan-800 dark:text-cyan-400 rounded-xl transition-all duration-200 ${
                isNextDisabled
                  ? "opacity-20 cursor-not-allowed text-gray-400"
                  : "hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-white/40 dark:hover:bg-black/10"
              }`}
              title={viewMode === "month" ? "次月" : "次年"}
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
          </div>

          <div className="flex bg-white/40 dark:bg-black/30 p-0.5 rounded-xl border border-white/50 dark:border-white/10 shadow-inner">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all duration-150 ${
                viewMode === "month"
                  ? "bg-cyan-800 dark:bg-cyan-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              月次
            </button>
            <button
              onClick={() => setViewMode("year")}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all duration-150 ${
                viewMode === "year"
                  ? "bg-cyan-800 dark:bg-cyan-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              年次
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ (タブ切替): アプリシェル内で唯一スクロールする領域 */}
      <main className="app-shell-scroll relative z-10 max-w-lg w-full mx-auto px-4 sm:px-6 py-6 pb-28">
        {activeTab === "home" && (
          <HomeView
            viewMode={viewMode}
            chartExpenses={chartExpenses}
            expensesLoading={expensesLoading}
            annualLoading={annualLoading}
            displayTotal={displayTotal}
            monthlyBudget={monthlyBudget}
            currentYear={currentYear}
            currentMonth={currentMonth}
            recentExpenses={recentExpenses}
            onNavigate={setActiveTab}
            onCategoryClick={goToHistoryWithCategory}
          />
        )}

        {activeTab === "insights" && (
          <InsightsView
            viewMode={viewMode}
            monthlyBudget={monthlyBudget}
            displayTotal={displayTotal}
            currentYear={currentYear}
            currentMonth={currentMonth}
            comparisonData={comparisonData}
            annualTotal={annualTotal}
            today={today}
            loading={expensesLoading || prevExpensesLoading || prevYearLoading}
            annualLoading={annualLoading}
            chartExpenses={chartExpenses}
            previousExpenses={previousPeriodExpenses}
            activeTrendData={activeTrendData}
            onGoToSettings={() => setActiveTab("settings")}
            onCategoryClick={goToHistoryWithCategory}
          />
        )}

        {activeTab === "history" && (
          <HistoryView
            familyId={familyId}
            year={currentYear}
            month={currentMonth}
            onMonthChange={(year, month) => {
              setCurrentYear(year);
              setCurrentMonth(month);
            }}
            viewMode={viewMode}
            initialCategory={initialCategoryFilter}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView familyId={userData?.familyId} onSignOut={handleSignOut} />
        )}
      </main>

      {/* ボトムナビゲーション */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== "history") setInitialCategoryFilter("all");
          setActiveTab(tab);
        }}
        onAddClick={() => setIsFormModalOpen(true)}
      />

      {/* 支出の追加モーダル */}
      {isFormModalOpen && (
        <Modal
          onClose={() => setIsFormModalOpen(false)}
          title="支出を追加"
        >
          <div className="flex bg-white/40 dark:bg-black/30 p-0.5 rounded-xl border border-white/50 dark:border-white/10 shadow-inner mb-4">
            <button
              onClick={() => setAddMode("manual")}
              className={`flex-1 px-3 py-2 text-xs font-black rounded-lg transition-all duration-150 ${
                addMode === "manual"
                  ? "bg-cyan-800 dark:bg-cyan-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              手入力
            </button>
            <button
              onClick={() => setAddMode("receipt")}
              className={`flex-1 px-3 py-2 text-xs font-black rounded-lg transition-all duration-150 ${
                addMode === "receipt"
                  ? "bg-cyan-800 dark:bg-cyan-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              レシート撮影
            </button>
          </div>

          {addMode === "manual" ? (
            <ExpenseForm
              userId={currentUser.uid}
              familyId={familyId}
              onClose={() => setIsFormModalOpen(false)}
            />
          ) : (
            <ReceiptScanForm
              userId={currentUser.uid}
              familyId={familyId}
              onClose={() => setIsFormModalOpen(false)}
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
