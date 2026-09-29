import React, { useMemo } from "react";
import BudgetGaugeCard from "./BudgetGaugeCard";
import PeriodComparisonCard from "./PeriodComparisonCard";
import CategoryRankingCard from "./CategoryRankingCard";
import CategoryMoversCard from "./CategoryMoversCard";
import SpendingTrendCard from "./SpendingTrendCard";
import FixedVariableCard from "./FixedVariableCard";
import AverageComparisonCard from "./AverageComparisonCard";
import SpendingPatternCard from "./SpendingPatternCard";
import { sumFixed } from "../utils/analytics";

const InsightsView = ({
  viewMode,
  monthlyBudget,
  displayTotal,
  currentYear,
  currentMonth,
  comparisonData,
  annualTotal,
  today,
  loading,
  annualLoading,
  chartExpenses,
  previousExpenses,
  activeTrendData,
  pastSixMonthExpenses,
  pastSixMonthLoading,
  onGoToSettings,
  onCategoryClick,
}) => {
  // 月末着地予測で固定費を日割りペースに含めないために使う
  const fixedTotal = useMemo(() => sumFixed(chartExpenses), [chartExpenses]);

  return (
    <div className="space-y-6">
      <section className="glass-card glass-card-interactive rounded-3xl p-6">
        <h4 className="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase mb-6">
          予算 &amp; 貯蓄率 ({viewMode === "month" ? "月次" : "年次"})
        </h4>
        <BudgetGaugeCard
          monthlyBudget={monthlyBudget}
          currentTotal={displayTotal}
          viewMode={viewMode}
          year={currentYear}
          month={currentMonth}
          fixedTotal={fixedTotal}
          onGoToSettings={onGoToSettings}
        />
      </section>

      <section className="glass-card glass-card-interactive rounded-3xl p-6">
        <h4 className="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase mb-4">
          前{viewMode === "month" ? "月" : "年"}比
        </h4>
        <PeriodComparisonCard
          comparisonData={comparisonData}
          annualTotal={annualTotal}
          currentYear={currentYear}
          today={today}
          loading={loading}
          annualLoading={annualLoading}
        />
      </section>

      {viewMode === "month" && (
        <section className="glass-card glass-card-interactive rounded-3xl p-6">
          <AverageComparisonCard
            currentExpenses={chartExpenses}
            pastExpenses={pastSixMonthExpenses}
            year={currentYear}
            month={currentMonth}
            loading={pastSixMonthLoading}
          />
        </section>
      )}

      <section className="glass-card glass-card-interactive rounded-3xl p-6">
        <FixedVariableCard expenses={chartExpenses} viewMode={viewMode} onGoToSettings={onGoToSettings} />
      </section>

      <section className="glass-card glass-card-interactive rounded-3xl p-6">
        <CategoryRankingCard
          expenses={chartExpenses}
          viewMode={viewMode}
          limit={8}
          onCategoryClick={onCategoryClick}
        />
      </section>

      <section className="glass-card glass-card-interactive rounded-3xl p-6">
        <CategoryMoversCard
          currentExpenses={chartExpenses}
          previousExpenses={previousExpenses}
          viewMode={viewMode}
        />
      </section>

      <section className="glass-card glass-card-interactive rounded-3xl p-6">
        <SpendingTrendCard data={activeTrendData} viewMode={viewMode} monthlyBudget={monthlyBudget} />
      </section>

      <section className="glass-card glass-card-interactive rounded-3xl p-6">
        {/* 期間が変わったら選択中の日付をリセットするため key を付ける */}
        <SpendingPatternCard
          key={`${viewMode}-${currentYear}-${currentMonth}`}
          expenses={chartExpenses}
          viewMode={viewMode}
          year={currentYear}
          month={currentMonth}
        />
      </section>
    </div>
  );
};

export default InsightsView;
