import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHistory } from "@fortawesome/free-solid-svg-icons";
import SummaryChart from "./SummaryChart";
import BudgetGaugeCard from "./BudgetGaugeCard";
import CategoryRankingCard from "./CategoryRankingCard";

const HomeView = ({
  viewMode,
  chartExpenses,
  expensesLoading,
  annualLoading,
  displayTotal,
  monthlyBudget,
  currentYear,
  currentMonth,
  recentExpenses,
  onNavigate,
  onCategoryClick,
}) => {
  const isLoading = expensesLoading || (viewMode === "year" && annualLoading);

  return (
    <div className="space-y-6">
      {/* サマリー + 予算ゲージ */}
      <section className="glass-card glass-card-interactive rounded-3xl p-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
            家計サマリー ({viewMode === "month" ? "月次" : "年次"})
          </h4>
        </div>

        {isLoading ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-16">データを集計中...</div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <SummaryChart expenses={chartExpenses} viewMode={viewMode} />
            </div>
            <div className="flex-1 flex justify-center border-t border-white/30 dark:border-white/5 pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-6">
              <BudgetGaugeCard
                monthlyBudget={monthlyBudget}
                currentTotal={displayTotal}
                viewMode={viewMode}
                year={currentYear}
                month={currentMonth}
                onGoToSettings={() => onNavigate("settings")}
                compact
              />
            </div>
          </div>
        )}
      </section>

      {/* 上位カテゴリー (構成比) */}
      <section className="glass-card glass-card-interactive rounded-3xl p-6">
        {isLoading ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-10">集計中...</div>
        ) : (
          <>
            <CategoryRankingCard
              expenses={chartExpenses}
              viewMode={viewMode}
              limit={3}
              onCategoryClick={onCategoryClick}
            />
            <button
              onClick={() => onNavigate("insights")}
              className="mt-4 w-full text-center text-xs font-black text-cyan-800 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:underline"
            >
              分析タブでもっと詳しく見る
            </button>
          </>
        )}
      </section>

      {/* 直近の支出プレビュー */}
      <section className="glass-card glass-card-interactive rounded-3xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faHistory} className="text-cyan-800 dark:text-cyan-400" />
            <h4 className="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
              直近の支出 ({viewMode === "month" ? "今月" : "今年"})
            </h4>
          </div>
          {chartExpenses.length > 5 && (
            <button
              onClick={() => onNavigate("history")}
              className="text-xs font-bold text-cyan-800 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:underline"
            >
              すべて表示 ({chartExpenses.length}件)
            </button>
          )}
        </div>

        {isLoading ? (
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
                onClick={() => onNavigate("history")}
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
  );
};

export default HomeView;
