// src/components/Dashboard.jsx
import React, { useState, useMemo } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { useUserData } from "../hooks/useUserData";
import { useMonthlyExpenses } from "../hooks/useMonthlyExpenses";
import { useRecentExpenses } from "../hooks/useRecentExpenses";
import { useAnnualExpenses } from "../hooks/useAnnualExpenses";
import { useTheme } from "../context/ThemeContext";
import FAB from "./FAB";
import Modal from "./Modal";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import SummaryChart from "./SummaryChart";
import SpendingTrendCard from "./SpendingTrendCard";
import CategoryRankingCard from "./CategoryRankingCard";
import SettingModal from "./SettingModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOutAlt,
  faListUl,
  faChevronLeft,
  faChevronRight,
  faCog,
  faMoon,
  faSun,
  faArrowUp,
  faArrowDown,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";

const Dashboard = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("month"); // "month" または "year"
  const [initialCategoryFilter, setInitialCategoryFilter] = useState("all"); // 支出リストの初期カテゴリーフィルター

  const { currentUser } = useAuth();
  const { userData, loading: userLoading } = useUserData();
  const { theme, toggleTheme } = useTheme();

  const familyId = !userLoading && userData ? userData.familyId : undefined;
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

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

  // 前年の累計支出額の取得 (前年比計算用)
  const { annualTotal: prevYearTotal, loading: prevYearLoading } = useAnnualExpenses(
    familyId,
    currentYear - 1
  );

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

  if (!currentUser || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl font-bold text-slate-700 dark:text-slate-200">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-16 transition-colors duration-300 text-slate-800 dark:text-gray-100">
      {/* 
        極上のUX ＆ アクセシビリティ：常時固定（Sticky）マルチレスポンシブヘッダー
        - モバイル版：1段目にウェルカム＆ボタンを配置し、2段目に月・年選択ナビゲーションを美しく常時固定。
      */}
      <header className="sticky top-0 z-40 bg-white/30 dark:bg-black/20 backdrop-blur-xl border-b border-white/40 dark:border-white/10 shadow-md px-4 sm:px-6 py-3.5 grid grid-cols-2 md:flex md:items-center md:justify-between gap-y-3.5 md:gap-y-0">
        
        {/* ウェルカムエリア (モバイル: 1段目左, PC: 左端) */}
        <div className="flex flex-col col-span-1">
          <span className="text-[9px] font-extrabold tracking-widest text-cyan-800 dark:text-cyan-400 uppercase">
            CHOKIN NO OUCHI
          </span>
          <h2 className="text-base font-black text-slate-800 dark:text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
            {userData?.displayName || "メンバー"}さん 👋
          </h2>
        </div>

        {/* コントロールボタン群 (モバイル: 1段目右, PC: 右端) */}
        <div className="flex items-center space-x-2.5 justify-end col-span-1 md:order-3">
          {/* ダークモード切替 */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center text-cyan-800 dark:text-cyan-400 bg-white/50 dark:bg-black/25 border border-cyan-800/20 dark:border-white/10 rounded-full shadow-sm hover:scale-105 active:scale-[0.95] transition-all duration-200"
            title={theme === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え"}
          >
            <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} className="text-base" />
          </button>
          {/* 設定 */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-cyan-800 dark:text-cyan-400 bg-white/50 dark:bg-black/25 border border-cyan-800/20 dark:border-white/10 rounded-full shadow-sm hover:scale-105 active:scale-[0.95] transition-all duration-200"
            title="ファミリーID設定"
          >
            <FontAwesomeIcon icon={faCog} className="text-base" />
          </button>
          {/* ログアウト */}
          <button
            onClick={handleSignOut}
            className="w-10 h-10 flex items-center justify-center text-cyan-800 dark:text-cyan-400 bg-white/50 dark:bg-black/25 border border-cyan-800/20 dark:border-white/10 rounded-full shadow-sm hover:scale-105 active:scale-[0.95] transition-all duration-200"
            title="ログアウト"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="text-base" />
          </button>
        </div>

        {/* 時間軸ナビゲーションエリア (モバイル: 2段目中央に大きく配置、PC: ヘッダー中央に配置) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 col-span-2 md:col-span-1 md:order-2 md:mx-auto w-full md:w-auto">
          {/* ナビゲーター */}
          <div className="flex items-center justify-between bg-white/40 dark:bg-black/25 border border-white/50 dark:border-white/10 rounded-2xl p-1 shadow-sm w-full max-w-[240px] sm:w-56">
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

          {/* 月・年切り替えセグメントコントローラー (高アクセシビリティ設計) */}
          <div className="flex bg-white/40 dark:bg-black/30 p-0.5 rounded-xl border border-white/50 dark:border-white/10 shadow-inner max-w-fit">
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

      {/* メインダッシュボードコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* 腕の見せ所: レスポンシブ・アシンメトリーグリッドレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 左カラム (円グラフ ＋ インサイト ＋ 直近の支出) - 比重 7/12 */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* メイン円グラフ & インサイトカード */}
            <section className="glass-card rounded-3xl p-6 relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                  家計サマリー ({viewMode === "month" ? "月次" : "年次"})
                </h4>
                {/* 履歴モーダル展開ボタン */}
                <button
                  onClick={() => {
                    setInitialCategoryFilter("all");
                    setIsListModalOpen(true);
                  }}
                  className="w-9 h-9 flex items-center justify-center text-cyan-800 dark:text-cyan-400 bg-white/40 dark:bg-black/25 border border-cyan-800/20 dark:border-white/10 rounded-xl shadow-sm hover:scale-105 active:scale-[0.95] transition-all"
                  title="すべての履歴"
                >
                  <FontAwesomeIcon icon={faListUl} />
                </button>
              </div>

              {expensesLoading || (viewMode === "year" && annualLoading) ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-16">データを集計中...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* 円グラフ領域 (月次または年次の全データを表示) */}
                  <div className="md:col-span-7">
                    <SummaryChart expenses={chartExpenses} viewMode={viewMode} />
                  </div>

                  {/* 比較・インサイト領域 (3段構成の極上情報設計) */}
                  <div className="md:col-span-5 flex flex-col justify-center space-y-4 bg-white/45 dark:bg-black/20 border border-white/50 dark:border-white/5 rounded-2xl p-4 shadow-inner">
                    
                    {/* 段1: 基準前データ */}
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                        {comparisonData.label}
                      </span>
                      {expensesLoading || prevExpensesLoading || prevYearLoading ? (
                        <span className="text-sm text-slate-400">読み込み中...</span>
                      ) : (
                        <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                          ¥{comparisonData.prevTotal.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* 段2: 基準差 (対比) */}
                    <div className="flex flex-col space-y-0.5 border-t border-white/40 dark:border-white/5 pt-2.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                        <span>{comparisonData.diffLabel}</span>
                        <FontAwesomeIcon 
                          icon={comparisonData.diff > 0 ? faArrowUp : faArrowDown} 
                          className={comparisonData.diff > 0 ? "text-pink-600 dark:text-pink-400" : "text-emerald-600 dark:text-emerald-400"} 
                        />
                      </span>
                      {expensesLoading || prevExpensesLoading || prevYearLoading ? (
                        <span className="text-sm text-slate-400">読み込み中...</span>
                      ) : (
                        <div className="flex items-baseline space-x-1">
                          <span className={`text-xl font-black ${
                            comparisonData.diff > 0 
                              ? "text-pink-600 dark:text-pink-400" 
                              : comparisonData.diff < 0 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : "text-slate-600 dark:text-slate-400"
                          }`}>
                            {comparisonData.diff > 0 ? "+" : ""}
                            ¥{comparisonData.diff.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                            ({comparisonData.subLabel})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 段3: マクロ参考指標 (常に年次の総額や月平均を確認可能) */}
                    <div className="flex flex-col space-y-0.5 border-t border-white/40 dark:border-white/5 pt-2.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                        {currentYear}年 累計支出
                      </span>
                      {annualLoading ? (
                        <span className="text-sm text-slate-400">集計中...</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-lg font-black text-cyan-800 dark:text-cyan-300">
                            ¥{annualTotal.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                            月平均: ¥{Math.round(annualTotal / (currentYear === today.getFullYear() ? (today.getMonth() + 1) : 12)).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* クイック追加フローティング（PCのみ、スマホではスクロール外に追従） */}
              <div className="hidden md:block absolute bottom-6 right-6">
                <FAB onClick={() => setIsFormModalOpen(true)} />
              </div>
            </section>

            {/* 直近の支出プレビューカード（ダッシュボード上の過去の一覧） */}
            <section className="glass-card rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faHistory} className="text-cyan-800 dark:text-cyan-400" />
                  <h4 className="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                    直近の支出 ({viewMode === "month" ? "今月" : "今年"})
                  </h4>
                </div>
                {chartExpenses.length > 5 && (
                  <button
                    onClick={() => {
                      setInitialCategoryFilter("all");
                      setIsListModalOpen(true);
                    }}
                    className="text-xs font-bold text-cyan-800 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:underline"
                  >
                    すべて表示 ({chartExpenses.length}件)
                  </button>
                )}
              </div>

              {expensesLoading || (viewMode === "year" && annualLoading) ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">読み込み中...</div>
              ) : recentExpenses.length === 0 ? (
                <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                  {viewMode === "month" ? "今月の支出はまだありません。" : "今年の支出はまだありません。"}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      onClick={() => {
                        setIsListModalOpen(true);
                      }}
                      className="p-3.5 flex justify-between items-center bg-white/20 dark:bg-black/15 border border-white/30 dark:border-white/5 rounded-2xl cursor-pointer hover:bg-white/35 dark:hover:bg-black/25 transition-all duration-200"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                          {new Date(expense.date).toLocaleDateString("ja-JP")}
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                          {expense.category}
                        </span>
                        {expense.description && (
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[200px] sm:max-w-md">
                            {expense.description}
                          </span>
                        )}
                      </div>
                      <span className="text-base font-extrabold text-pink-600 dark:text-pink-400">
                        ¥{expense.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 右カラム (ランキング ＋ 推移グラフ) - 比重 5/12 */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* カテゴリランキング (月次・年次の自動切り替えに対応) */}
            <section className="glass-card rounded-3xl p-6">
              {expensesLoading || (viewMode === "year" && annualLoading) ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-10">集計中...</div>
              ) : (
                <CategoryRankingCard 
                  expenses={chartExpenses} 
                  viewMode={viewMode} 
                  onCategoryClick={(categoryName) => {
                    setInitialCategoryFilter(categoryName);
                    setIsListModalOpen(true);
                  }}
                />
              )}
            </section>

            {/* 支出推移グラフ (月次は過去3ヶ月、年次は当年の1月〜12月の全推移を切り替えて滑らかに可視化！) */}
            <section className="glass-card rounded-3xl p-6">
              <SpendingTrendCard data={activeTrendData} viewMode={viewMode} />
            </section>
          </div>

        </div>
      </main>

      {/* スマートフォン用フローティング追加ボタン（スクロール追従型） */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <FAB onClick={() => setIsFormModalOpen(true)} />
      </div>

      {/* モーダル群 */}

      {/* 支出の追加モーダル */}
      {isFormModalOpen && (
        <Modal onClose={() => setIsFormModalOpen(false)} title="支出を追加">
          <ExpenseForm
            userId={currentUser.uid}
            familyId={familyId}
            onClose={() => setIsFormModalOpen(false)}
          />
        </Modal>
      )}

      {/* 支出リストモーダル */}
      {isListModalOpen && (
        <Modal onClose={() => setIsListModalOpen(false)} title="支出リスト">
          <ExpenseList
            familyId={familyId}
            year={currentYear}
            month={currentMonth}
            onMonthChange={(year, month) => {
              setCurrentYear(year);
              setCurrentMonth(month);
            }}
            onClose={() => setIsListModalOpen(false)}
            viewMode={viewMode}
            initialCategory={initialCategoryFilter}
          />
        </Modal>
      )}

      {/* 設定モーダル */}
      {isSettingsModalOpen && (
        <Modal onClose={() => setIsSettingsModalOpen(false)} title="設定">
          <SettingModal 
            familyId={userData?.familyId} 
            onClose={() => setIsSettingsModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
