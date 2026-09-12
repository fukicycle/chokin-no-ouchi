import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";

const PeriodComparisonCard = ({
  comparisonData,
  annualTotal,
  currentYear,
  today,
  loading,
  annualLoading,
}) => {
  const { label, prevTotal, diff, diffLabel, subLabel } = comparisonData;
  const diffPercent = prevTotal > 0 ? (diff / prevTotal) * 100 : null;

  return (
    <div className="w-full flex flex-col space-y-4 bg-white/45 dark:bg-black/20 border border-white/50 dark:border-white/5 rounded-2xl p-4 shadow-inner">
      {/* 段1: 基準前データ */}
      <div className="flex flex-col space-y-0.5">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
          {label}
        </span>
        {loading ? (
          <span className="text-sm text-slate-400">読み込み中...</span>
        ) : (
          <span className="text-base font-bold text-slate-700 dark:text-slate-300">
            ¥{prevTotal.toLocaleString()}
          </span>
        )}
      </div>

      {/* 段2: 基準差 (対比 ¥ + %) */}
      <div className="flex flex-col space-y-0.5 border-t border-white/40 dark:border-white/5 pt-2.5">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
          <span>{diffLabel}</span>
          <FontAwesomeIcon
            icon={diff > 0 ? faArrowUp : faArrowDown}
            className={diff > 0 ? "text-pink-600 dark:text-pink-400" : "text-emerald-600 dark:text-emerald-400"}
          />
        </span>
        {loading ? (
          <span className="text-sm text-slate-400">読み込み中...</span>
        ) : (
          <div className="flex items-baseline space-x-2 flex-wrap">
            <span
              className={`text-xl font-black ${
                diff > 0
                  ? "text-pink-600 dark:text-pink-400"
                  : diff < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {diffPercent === null
                ? "--"
                : `${diffPercent > 0 ? "+" : ""}${Math.round(diffPercent)}%`}
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              ({diff > 0 ? "+" : ""}¥{diff.toLocaleString()})
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">
              {subLabel}
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
              月平均: ¥
              {Math.round(
                annualTotal / (currentYear === today.getFullYear() ? today.getMonth() + 1 : 12)
              ).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeriodComparisonCard;
