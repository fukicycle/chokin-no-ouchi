import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// 洗練されたグラスモルフィズムに調和するプレミアム・カラーパレット
const COLORS = ['#38bdf8', '#f06292', '#34d399', '#fbbf24', '#818cf8', '#f43f5e', '#a78bfa'];

// ホームは「スクロールなしで1画面に収める」ため、凡例の件数を絞る。
// あふれた分は「他N件」にまとめ、内訳は分析タブで確認してもらう。
const LEGEND_LIMIT = 4;

/**
 * カテゴリー構成の円グラフ。
 * 高さは親から与えられた分だけを使い、円グラフ(flex-1)が余りを吸収する。
 * これにより画面の高さが変わってもこのコンポーネント自身はスクロールしない。
 */
const SummaryChart = ({ expenses }) => {
  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const categoryData = useMemo(() => {
    const categories = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.keys(categories)
      .map((category) => ({
        name: category,
        value: categories[category],
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const legendData = useMemo(() => categoryData.slice(0, LEGEND_LIMIT), [categoryData]);
  const hiddenLegendCount = categoryData.length - legendData.length;

  return (
    <div className="h-full min-h-0 flex flex-col items-center text-text-dark dark:text-gray-100">
      <div className="w-full flex-1 min-h-0 relative flex items-center justify-center">
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                // 親の高さに応じて太さが変わるよう半径は割合で指定する
                innerRadius="62%"
                outerRadius="88%"
                fill="#8884d8"
                paddingAngle={4}
                dataKey="value"
                labelLine={false}
                isAnimationActive={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                itemStyle={{ color: '#fff' }}
                formatter={(value) => [`¥${value.toLocaleString()}`, '金額']}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 px-2">
            支出を記録するとグラフが表示されます。
          </div>
        )}
      </div>

      {/* 凡例 (上位カテゴリーのみ。スクロールさせず件数で抑える)。
          高さが極端に足りない端末では省略し、円グラフの表示領域を優先する。 */}
      {legendData.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 w-full px-1 shrink-0 very-short:hidden">
          {legendData.map((entry, index) => (
            <div
              key={`legend-${index}`}
              className="flex items-center space-x-1.5 bg-white/20 dark:bg-black/10 px-2 py-0.5 rounded-full border border-white/30 dark:border-white/5 shadow-sm text-[11px] font-medium"
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-700 dark:text-gray-300">{entry.name}</span>
              <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                ({totalAmount > 0 ? Math.round((entry.value / totalAmount) * 100) : 0}%)
              </span>
            </div>
          ))}
          {hiddenLegendCount > 0 && (
            <div className="flex items-center px-2 py-0.5 rounded-full border border-white/30 dark:border-white/5 bg-white/10 dark:bg-black/10 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              他{hiddenLegendCount}件
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryChart;
