import React, { useMemo } from "react";
import BudgetGaugeCard from "./BudgetGaugeCard";
import PeriodComparisonCard from "./PeriodComparisonCard";
import CategoryRankingCard from "./CategoryRankingCard";
import CategoryMoversCard from "./CategoryMoversCard";
import SpendingTrendCard from "./SpendingTrendCard";
import FixedVariableCard from "./FixedVariableCard";

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
  onGoToSettings,
  onCategoryClick,
}) => {
  // 月末着地予測で固定費を日割りペースに含めないために使う
  const fixedTotal = useMemo(
    () => chartExpenses.reduce((sum, e) => sum + (e.isFixed ? e.amount || 0 : 0), 0),
    [chartExpenses]
  );

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
        <SpendingTrendCard data={activeTrendData} viewMode={viewMode} />
      </section>
    </div>
  );
};

export default InsightsView;
