import React, { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRepeat } from "@fortawesome/free-solid-svg-icons";

/**
 * 固定費と変動費の内訳。
 * 固定費は削りにくく変動費は日々の工夫で減らせるため、分けて見ると
 * 「どこを見直せば効くか」が分かりやすくなる。
 */
const FixedVariableCard = ({ expenses, viewMode = "month", onGoToSettings }) => {
  const { fixedTotal, variableTotal, fixedItems } = useMemo(() => {
    let fixed = 0;
    let variable = 0;
    const items = {};
    expenses.forEach((e) => {
      const amount = e.amount || 0;
      if (e.isFixed) {
        fixed += amount;
        const name = e.description || e.category;
        items[name] = (items[name] || 0) + amount;
      } else {
        variable += amount;
      }
    });
    return {
      fixedTotal: fixed,
      variableTotal: variable,
      fixedItems: Object.entries(items).sort(([, a], [, b]) => b - a),
    };
  }, [expenses]);

  const total = fixedTotal + variableTotal;
  const fixedShare = total > 0 ? Math.round((fixedTotal / total) * 100) : 0;
  const variableShare = total > 0 ? 100 - fixedShare : 0;

  return (
    <div className="w-full text-text-dark dark:text-gray-100">
      <h3 className="text-base font-bold mb-4 tracking-wide uppercase text-gray-500 dark:text-gray-400">
        固定費 / 変動費 ({viewMode === "month" ? "今月" : "今年"})
      </h3>

      {fixedTotal === 0 ? (
        <div className="text-center py-4 space-y-3">
          <FontAwesomeIcon icon={faRepeat} className="text-2xl text-slate-400 dark:text-slate-500" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            家賃やサブスクなどを固定費として登録すると、毎月自動で計上され変動費と分けて分析できます。
          </p>
          {onGoToSettings && (
            <button
              onClick={onGoToSettings}
              className="px-4 py-2 text-xs font-black text-white bg-cyan-800 dark:bg-cyan-600 rounded-xl shadow-md hover:bg-cyan-900 dark:hover:bg-cyan-500 transition-all active:scale-95"
            >
              設定で固定費を登録する
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="px-3 py-2.5 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/5 rounded-2xl">
              <span className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                固定費
              </span>
              <span className="block text-lg font-black text-indigo-600 dark:text-indigo-300">
                ¥{fixedTotal.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{fixedShare}%</span>
            </div>
            <div className="px-3 py-2.5 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/5 rounded-2xl">
              <span className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                変動費
              </span>
              <span className="block text-lg font-black text-pink-600 dark:text-pink-400">
                ¥{variableTotal.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{variableShare}%</span>
            </div>
          </div>

          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-400/15">
            <div className="bg-indigo-500 dark:bg-indigo-400" style={{ width: `${fixedShare}%` }} />
            <div className="bg-pink-500 dark:bg-pink-400" style={{ width: `${variableShare}%` }} />
          </div>

          <div>
            <span className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              固定費の内訳
            </span>
            <ul className="space-y-1.5">
              {fixedItems.map(([name, amount]) => (
                <li key={name} className="flex items-center justify-between px-3 py-1.5 text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[60%]">{name}</span>
                  <span className="font-black text-slate-800 dark:text-white">¥{amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedVariableCard;
