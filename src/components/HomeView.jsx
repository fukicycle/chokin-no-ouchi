import React from "react";
import SummaryChart from "./SummaryChart";
import BudgetGaugeCard from "./BudgetGaugeCard";

/**
 * ホームは「家計サマリーだけを、どの端末でもスクロールなしで見られる画面」。
 *
 * 親から渡された高さ(h-full)をそのまま使い切り、内部では円グラフだけが
 * flex-1 で余りを吸収する。カテゴリー内訳や直近の支出など高さが可変になる
 * 要素はここには置かず、分析タブ・履歴タブに任せる。
 *
 * 画面が低い端末(横向きスマホなど)では縦積みだと円グラフが潰れてしまうため、
 * short ブレークポイント(高さ620px以下)で金額ブロックと円グラフを横並びにする。
 */
const HomeView = ({
  viewMode,
  chartExpenses,
  expensesLoading,
  annualLoading,
  displayTotal,
  monthlyBudget,
  currentYear,
  currentMonth,
  onNavigate,
}) => {
  const isLoading = expensesLoading || (viewMode === "year" && annualLoading);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <section className="glass-card rounded-3xl p-4 sm:p-5 short:p-3 flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col wide-short:flex-row wide-short:items-center wide-short:gap-3">
          {/* 合計金額 + 予算ゲージ */}
          <div className="shrink-0 flex items-center justify-between gap-3 wide-short:flex-col wide-short:items-start wide-short:justify-center wide-short:gap-1">
            <div className="flex flex-col min-w-0">
              <h4 className="text-[10px] font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                家計サマリー ({viewMode === "month" ? "月次" : "年次"})
              </h4>
              <span className="text-3xl sm:text-4xl short:text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-600 to-pink-600 dark:from-cyan-400 dark:to-pink-400 bg-clip-text text-transparent">
                ¥{displayTotal.toLocaleString()}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider very-short:hidden">
                {viewMode === "month" ? "今月の合計支出" : "今年の合計支出"}
              </span>
            </div>

            <BudgetGaugeCard
              monthlyBudget={monthlyBudget}
              currentTotal={displayTotal}
              viewMode={viewMode}
              year={currentYear}
              month={currentMonth}
              onGoToSettings={() => onNavigate("settings")}
              mini
            />
          </div>

          {/* 円グラフ + 凡例 (余った高さをすべて使う) */}
          {isLoading ? (
            <div className="flex-1 min-h-0 flex items-center justify-center text-slate-500 dark:text-slate-400">
              データを集計中...
            </div>
          ) : (
            <div className="flex-1 min-h-0 wide-short:h-full">
              <SummaryChart expenses={chartExpenses} />
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate("insights")}
          className="mt-2 shrink-0 w-full text-center text-xs font-black text-cyan-800 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:underline very-short:hidden"
        >
          分析タブでもっと詳しく見る
        </button>
      </section>
    </div>
  );
};

export default HomeView;
