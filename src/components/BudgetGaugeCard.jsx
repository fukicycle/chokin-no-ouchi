import React, { useMemo } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPiggyBank, faGaugeHigh, faTriangleExclamation, faCalendarDay } from "@fortawesome/free-solid-svg-icons";

const BudgetGaugeCard = ({
  monthlyBudget,
  currentTotal,
  viewMode = "month",
  year,
  month,
  onGoToSettings,
  // 期間内に計上済みの固定費。固定費は月初にまとめて計上されるため、
  // 日割りペースで引き伸ばさず着地予測にそのまま足す。
  fixedTotal = 0,
  compact = false,
  // ホームの1画面レイアウト用。ゲージだけを小さく出し、未設定時も
  // 高さを食わない1行のボタンに切り替える。
  mini = false,
}) => {
  const today = new Date();

  const periodBudget = useMemo(() => {
    return viewMode === "month" ? monthlyBudget : monthlyBudget * 12;
  }, [monthlyBudget, viewMode]);

  const consumptionRate = useMemo(() => {
    if (!periodBudget) return null;
    return (currentTotal / periodBudget) * 100;
  }, [currentTotal, periodBudget]);

  const savingsRate = consumptionRate === null ? null : Math.max(0, 100 - consumptionRate);
  const overRate = consumptionRate !== null && consumptionRate > 100 ? consumptionRate - 100 : 0;

  const pace = useMemo(() => {
    if (!periodBudget) return null;

    if (viewMode === "month") {
      const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;
      if (!isCurrentMonth || daysElapsed >= daysInMonth) return null;
      const variableTotal = Math.max(0, currentTotal - fixedTotal);
      const projected = fixedTotal + (variableTotal / daysElapsed) * daysInMonth;
      return { projected, rate: (projected / periodBudget) * 100 };
    } else {
      const isCurrentYear = year === today.getFullYear();
      const monthsElapsed = isCurrentYear ? today.getMonth() + 1 : 12;
      if (!isCurrentYear || monthsElapsed >= 12) return null;
      const projected = (currentTotal / monthsElapsed) * 12;
      return { projected, rate: (projected / periodBudget) * 100 };
    }
  }, [periodBudget, currentTotal, fixedTotal, viewMode, year, month]);

  // 今月の残り日数(今日を含む)で予算内に収めるための1日あたりの上限
  const dailyAllowance = useMemo(() => {
    if (!periodBudget || viewMode !== "month") return null;
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    if (!isCurrentMonth) return null;
    const remainingDays = new Date(year, month, 0).getDate() - today.getDate() + 1;
    const remaining = periodBudget - currentTotal;
    return { remainingDays, remaining, perDay: remaining > 0 ? remaining / remainingDays : 0 };
  }, [periodBudget, currentTotal, viewMode, year, month]);

  const gaugeColor = consumptionRate === null
    ? "#94a3b8"
    : consumptionRate > 100
    ? "#f43f5e"
    : consumptionRate > 80
    ? "#fbbf24"
    : "#22d3ee";

  const gaugeData = [
    {
      name: "rate",
      value: consumptionRate === null ? 0 : Math.min(consumptionRate, 100),
      fill: gaugeColor,
    },
  ];

  if (!periodBudget) {
    if (mini) {
      return (
        <button
          onClick={onGoToSettings}
          className="flex flex-col items-center justify-center w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl border border-dashed border-slate-400/50 dark:border-slate-500/40 text-slate-500 dark:text-slate-400 hover:border-cyan-700/60 hover:text-cyan-800 dark:hover:text-cyan-400 transition-colors active:scale-95"
          title="設定で月間予算を入力する"
        >
          <FontAwesomeIcon icon={faGaugeHigh} className="text-lg" />
          <span className="mt-1 text-[9px] font-extrabold leading-tight text-center">
            予算
            <br />
            未設定
          </span>
        </button>
      );
    }

    return (
      <div className="w-full text-center py-6 space-y-3">
        <FontAwesomeIcon icon={faGaugeHigh} className="text-3xl text-slate-400 dark:text-slate-500" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          月間予算が未設定です
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          予算を設定すると消化率・貯蓄率・支出ペースが可視化されます。
        </p>
        {onGoToSettings && (
          <button
            onClick={onGoToSettings}
            className="mt-1 px-4 py-2 text-xs font-black text-white bg-cyan-800 dark:bg-cyan-600 rounded-xl shadow-md hover:bg-cyan-900 dark:hover:bg-cyan-500 transition-all active:scale-95"
          >
            設定で予算を入力する
          </button>
        )}
      </div>
    );
  }

  const gaugeSize = mini ? 80 : compact ? 128 : 176;

  return (
    <div className={`flex flex-col items-center ${mini ? "" : "w-full"}`}>
      <div className="relative" style={{ width: gaugeSize, height: gaugeSize }}>
        <RadialBarChart
          width={gaugeSize}
          height={gaugeSize}
          cx="50%"
          cy="50%"
          innerRadius="72%"
          outerRadius="100%"
          barSize={mini ? 8 : compact ? 10 : 14}
          data={gaugeData}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: "rgba(148,163,184,0.15)" }} dataKey="value" cornerRadius={20} clockWise />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`${mini ? "text-sm" : compact ? "text-xl" : "text-3xl"} font-black tracking-tight`}
            style={{ color: gaugeColor }}
          >
            {consumptionRate === null ? "--" : `${Math.round(consumptionRate)}%`}
          </span>
          <span
            className={`${
              mini ? "text-[8px]" : "text-[9px]"
            } font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider`}
          >
            {mini ? "消化率" : "予算消化率"}
          </span>
        </div>
      </div>

      {!compact && !mini && (
        <div className="w-full mt-5 space-y-2.5">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/5 rounded-2xl shadow-inner">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faPiggyBank} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {overRate > 0 ? "予算超過率" : "貯蓄率(予算の余り)"}
              </span>
            </div>
            <span
              className={`text-base font-black ${
                overRate > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {overRate > 0 ? `+${Math.round(overRate)}%` : `${Math.round(savingsRate)}%`}
            </span>
          </div>

          {dailyAllowance && (
            <div className="flex items-start justify-between px-3.5 py-2.5 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/5 rounded-2xl shadow-inner">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faCalendarDay} className="text-cyan-700 dark:text-cyan-400" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">1日あたり使える額</span>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-sm font-black ${
                    dailyAllowance.remaining > 0 ? "text-slate-800 dark:text-white" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  ¥{Math.floor(dailyAllowance.perDay).toLocaleString()}
                </span>
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                  {dailyAllowance.remaining > 0
                    ? `残り${dailyAllowance.remainingDays}日 / ¥${dailyAllowance.remaining.toLocaleString()}`
                    : "予算を使い切りました"}
                </span>
              </div>
            </div>
          )}

          {pace && (
            <div className="flex items-start justify-between px-3.5 py-2.5 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/5 rounded-2xl shadow-inner">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className={pace.rate > 100 ? "text-rose-500" : "text-amber-500"}
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {viewMode === "month" ? "月末着地予測" : "年末着地予測"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-slate-800 dark:text-white">
                  ¥{Math.round(pace.projected).toLocaleString()}
                </span>
                <span
                  className={`text-[10px] font-extrabold ${
                    pace.rate > 100 ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  予算比 {Math.round(pace.rate)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetGaugeCard;
