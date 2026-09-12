import React, { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowTrendUp, faArrowTrendDown } from "@fortawesome/free-solid-svg-icons";

const sumByCategory = (expenses) => {
  return expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});
};

const CategoryMoversCard = ({ currentExpenses, previousExpenses, viewMode = "month" }) => {
  const movers = useMemo(() => {
    const currentMap = sumByCategory(currentExpenses);
    const previousMap = sumByCategory(previousExpenses);
    const categories = new Set([...Object.keys(currentMap), ...Object.keys(previousMap)]);

    return Array.from(categories).map((category) => {
      const current = currentMap[category] || 0;
      const previous = previousMap[category] || 0;
      const diff = current - previous;
      const percent = previous > 0 ? (diff / previous) * 100 : current > 0 ? null : 0;
      return { category, current, previous, diff, percent };
    });
  }, [currentExpenses, previousExpenses]);

  const increases = useMemo(() => {
    return movers
      .filter((m) => m.diff > 0)
      .sort((a, b) => (b.percent === null ? Infinity : b.percent) - (a.percent === null ? Infinity : a.percent))
      .slice(0, 3);
  }, [movers]);

  const decreases = useMemo(() => {
    return movers
      .filter((m) => m.diff < 0)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 3);
  }, [movers]);

  const renderRow = (m, tone) => (
    <li key={m.category} className="flex items-center justify-between px-3 py-2 bg-white/25 dark:bg-black/15 border border-white/30 dark:border-white/5 rounded-xl">
      <span className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[45%]">
        {m.category}
      </span>
      <div className="flex items-baseline space-x-2">
        <span className={`text-sm font-black ${tone === "up" ? "text-pink-600 dark:text-pink-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          {m.percent === null ? "新規" : `${m.percent > 0 ? "+" : ""}${Math.round(m.percent)}%`}
        </span>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          ({m.diff > 0 ? "+" : ""}¥{m.diff.toLocaleString()})
        </span>
      </div>
    </li>
  );

  return (
    <div className="w-full text-text-dark dark:text-gray-100">
      <h3 className="text-base font-bold mb-4 tracking-wide uppercase text-gray-500 dark:text-gray-400">
        カテゴリー別 {viewMode === "month" ? "前月比" : "前年比"}
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center space-x-1.5 mb-2">
            <FontAwesomeIcon icon={faArrowTrendUp} className="text-pink-600 dark:text-pink-400 text-xs" />
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              支出が増えたカテゴリー
            </span>
          </div>
          {increases.length > 0 ? (
            <ul className="space-y-2">{increases.map((m) => renderRow(m, "up"))}</ul>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 px-1">増加したカテゴリーはありません。</p>
          )}
        </div>

        <div>
          <div className="flex items-center space-x-1.5 mb-2">
            <FontAwesomeIcon icon={faArrowTrendDown} className="text-emerald-600 dark:text-emerald-400 text-xs" />
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              支出が減ったカテゴリー
            </span>
          </div>
          {decreases.length > 0 ? (
            <ul className="space-y-2">{decreases.map((m) => renderRow(m, "down"))}</ul>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 px-1">減少したカテゴリーはありません。</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryMoversCard;
