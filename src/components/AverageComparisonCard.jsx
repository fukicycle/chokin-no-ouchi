import React, { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { addMonths } from "../utils/fixedCosts";
import { monthProgress, projectMonthTotal, sumAmount, sumFixed, totalsByMonth } from "../utils/analytics";

const CATEGORY_LIMIT = 6;
// カテゴリーのバーは平均の150%までを描く。平均の位置に目盛りを置く
const BAR_MAX_RATIO = 1.5;

const formatDiffPercent = (value, base) => {
  if (!base) return "--";
  const p = Math.round(((value - base) / base) * 100);
  return `${p > 0 ? "+" : ""}${p}%`;
};

// 支出のあった月だけで平均する (使い始めの月や記録していない月で平均が下がらないように)
const averageOf = (monthKeys, monthTotals) => {
  const values = monthKeys.map((k) => monthTotals[k]).filter((v) => v > 0);
  if (values.length === 0) return null;
  return { value: values.reduce((a, b) => a + b, 0) / values.length, months: values.length };
};

/**
 * 過去3ヶ月・6ヶ月の平均との比較。
 * 前月比は1ヶ月のブレ(ボーナス月・旅行など)に引きずられやすいので、平均と比べて
 * 「いつもと比べてどうか」を見る。進行中の月は着地予測で比べる。
 */
const AverageComparisonCard = ({ currentExpenses, pastExpenses, year, month, loading }) => {
  const summary = useMemo(() => {
    const currentKey = `${year}-${String(month).padStart(2, "0")}`;
    const past6 = Array.from({ length: 6 }, (_, i) => addMonths(currentKey, -(i + 1)));
    const past3 = past6.slice(0, 3);
    const monthTotals = totalsByMonth(pastExpenses);

    const total = sumAmount(currentExpenses);
    const projected = projectMonthTotal(total, sumFixed(currentExpenses), year, month);
    const { daysElapsed, daysInMonth, inProgress } = monthProgress(year, month);

    const avg6 = averageOf(past6, monthTotals);

    // カテゴリー別: 過去6ヶ月(支出のあった月)の平均と今月の実績
    const pastByCategory = {};
    pastExpenses.forEach((e) => {
      pastByCategory[e.category] = (pastByCategory[e.category] || 0) + (e.amount || 0);
    });
    const currentByCategory = {};
    currentExpenses.forEach((e) => {
      currentByCategory[e.category] = (currentByCategory[e.category] || 0) + (e.amount || 0);
    });
    const categories = avg6
      ? Array.from(new Set([...Object.keys(pastByCategory), ...Object.keys(currentByCategory)]))
          .map((category) => ({
            category,
            current: currentByCategory[category] || 0,
            average: (pastByCategory[category] || 0) / avg6.months,
          }))
          .sort((a, b) => Math.max(b.current, b.average) - Math.max(a.current, a.average))
          .slice(0, CATEGORY_LIMIT)
      : [];

    return {
      total,
      projected,
      compareValue: projected ?? total,
      inProgress,
      elapsedPercent: Math.round((daysElapsed / daysInMonth) * 100),
      averages: [
        { label: "過去3ヶ月平均", avg: averageOf(past3, monthTotals) },
        { label: "過去6ヶ月平均", avg: avg6 },
      ],
      categories,
    };
  }, [currentExpenses, pastExpenses, year, month]);

  const { total, projected, compareValue, inProgress, elapsedPercent, averages, categories } = summary;
  const hasHistory = averages.some((a) => a.avg);

  return (
    <div className="w-full text-text-dark dark:text-gray-100">
      <h3 className="text-base font-bold mb-4 tracking-wide uppercase text-gray-500 dark:text-gray-400">
        過去の平均との比較
      </h3>

      {loading ? (
        <p className="text-sm text-slate-400 py-4 text-center">集計中...</p>
      ) : !hasHistory ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
          前月までの支出が記録されると表示されます。
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-end justify-between px-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {inProgress ? "今月の着地予測" : "この月の支出"}
              </span>
              <span className="text-xl font-black text-slate-800 dark:text-white">
                ¥{Math.round(compareValue).toLocaleString()}
              </span>
            </div>
            {inProgress && projected !== null && (
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-right">
                現在 ¥{total.toLocaleString()}
                <br />
                月の{elapsedPercent}%経過
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {averages.map(({ label, avg }) => {
              const diff = avg ? compareValue - avg.value : 0;
              return (
                <div
                  key={label}
                  className="px-3 py-2.5 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/5 rounded-2xl"
                >
                  <span className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400">{label}</span>
                  {avg ? (
                    <>
                      <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                        ¥{Math.round(avg.value).toLocaleString()}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-base font-black ${
                          diff > 0 ? "text-pink-600 dark:text-pink-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        <FontAwesomeIcon icon={diff > 0 ? faArrowUp : faArrowDown} className="text-[10px]" />
                        {formatDiffPercent(compareValue, avg.value)}
                      </span>
                    </>
                  ) : (
                    <span className="block text-sm text-slate-400">データなし</span>
                  )}
                </div>
              );
            })}
          </div>
          {averages[1].avg && averages[1].avg.months < 6 && (
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1">
              ※ 支出の記録がある{averages[1].avg.months}ヶ月分で平均しています。
            </p>
          )}

          {categories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  カテゴリー別 (6ヶ月平均比{inProgress ? "・今日までの実績" : ""})
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="inline-block w-0.5 h-2.5 bg-slate-500 dark:bg-slate-300" />
                  平均
                </span>
              </div>
              <ul className="space-y-2.5">
                {categories.map(({ category, current, average }) => {
                  const ratio = average > 0 ? current / average : null;
                  const width = ratio === null ? 100 : (Math.min(ratio, BAR_MAX_RATIO) / BAR_MAX_RATIO) * 100;
                  const over = ratio === null || ratio > 1;
                  return (
                    <li
                      key={category}
                      className="px-1"
                      title={`${category}: 今月 ¥${current.toLocaleString()} / 平均 ¥${Math.round(average).toLocaleString()}`}
                    >
                      <div className="flex items-baseline justify-between text-xs mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[45%]">
                          {category}
                        </span>
                        <span className="font-bold text-slate-500 dark:text-slate-400">
                          ¥{current.toLocaleString()}
                          <span className="mx-1">/</span>
                          ¥{Math.round(average).toLocaleString()}
                          <span className="ml-1.5 font-black text-slate-800 dark:text-white">
                            {ratio === null ? "新規" : `${Math.round(ratio * 100)}%`}
                          </span>
                        </span>
                      </div>
                      <div className="relative h-2 rounded-full bg-slate-400/15">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full ${
                            over ? "bg-pink-500 dark:bg-pink-400" : "bg-cyan-600 dark:bg-cyan-400"
                          }`}
                          style={{ width: `${width}%` }}
                        />
                        {average > 0 && (
                          <span
                            className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-slate-500 dark:bg-slate-300"
                            style={{ left: `${(1 / BAR_MAX_RATIO) * 100}%` }}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AverageComparisonCard;
