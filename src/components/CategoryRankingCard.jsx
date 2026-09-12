import React, { useMemo } from 'react';

const CategoryRankingCard = ({ expenses, viewMode = 'month', onCategoryClick, limit = 5, title }) => {
  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const rankingData = useMemo(() => {
    const categories = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  }, [expenses, limit]);

  const maxAmount = useMemo(() => {
    if (rankingData.length === 0) return 1;
    return rankingData[0][1];
  }, [rankingData]);

  const getRankBadgeColor = (index) => {
    switch (index) {
      case 0:
        return 'bg-amber-500 text-white font-extrabold';
      case 1:
        return 'bg-slate-300 text-slate-800 font-bold';
      case 2:
        return 'bg-amber-700/60 text-white font-bold';
      default:
        return 'bg-white/40 dark:bg-black/20 text-gray-500 dark:text-gray-400 font-medium';
    }
  };

  return (
    <div className="w-full text-text-dark dark:text-gray-100">
      <h3 className="text-base font-bold mb-4 tracking-wide uppercase text-gray-500 dark:text-gray-400">
        {title || (viewMode === 'month' ? 'カテゴリー構成比 (今月)' : 'カテゴリー構成比 (今年)')}
      </h3>
      {rankingData.length > 0 ? (
        <ul className="space-y-3.5">
          {rankingData.map(([category, amount], index) => {
            const barWidth = (amount / maxAmount) * 100;
            const share = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
            return (
              <li
                key={index}
                onClick={() => onCategoryClick && onCategoryClick(category)}
                className="relative flex flex-col space-y-1 cursor-pointer group active:scale-[0.99]"
                title={`${category}の明細をフィルタリング表示`}
              >
                {/* 背景の進行度バー (ホバー時に少し色が濃くなります) */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/15 to-pink-500/10 dark:from-cyan-500/10 dark:to-pink-500/5 group-hover:from-cyan-500/25 group-hover:to-pink-500/15 rounded-xl transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />

                <div className="relative z-10 flex justify-between items-center px-3 py-2.5 border border-transparent group-hover:border-white/20 dark:group-hover:border-white/5 rounded-xl transition-all">
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm ${getRankBadgeColor(index)}`}>
                      {index + 1}
                    </span>
                    <span className="font-bold text-sm group-hover:text-cyan-800 dark:group-hover:text-cyan-400 transition-colors">
                      {category}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-black text-base text-slate-800 dark:text-white">
                      {share}%
                    </span>
                    <span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                      ¥{amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
          支出を記録すると表示されます。
        </div>
      )}
    </div>
  );
};

export default CategoryRankingCard;
