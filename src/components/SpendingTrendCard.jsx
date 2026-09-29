import React, { useMemo } from 'react';
import { formatYenAxis } from '../utils/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const BUDGET_COLOR = '#94a3b8';
const AVERAGE_COLOR = '#a78bfa';

const SpendingTrendCard = ({ data, viewMode = 'month', monthlyBudget = 0 }) => {
  const chartData = useMemo(() => {
    return data.map(item => {
      const parts = item.month.split('-');
      const monthNum = parts.length > 1 ? parseInt(parts[1], 10) : new Date(item.month).getMonth() + 1;
      return {
        name: `${monthNum}月`,
        支出: item.total,
      };
    });
  }, [data]);

  // 平均は支出のあった月だけで計算する (未来の月や記録していない月を含めない)
  const average = useMemo(() => {
    const values = data.map((item) => item.total).filter((v) => v > 0);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  }, [data]);

  return (
    <div className="w-full text-text-dark dark:text-gray-100">
      <h3 className="text-base font-bold mb-4 tracking-wide uppercase text-gray-500 dark:text-gray-400 text-center">
        {viewMode === 'month' ? '支出の推移 (直近3ヶ月)' : '支出の推移 (年間)'}
      </h3>
      {chartData.length > 0 ? (
        <>
          <div className="w-full h-[200px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#f06292" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis 
                  dataKey="name" 
                  stroke="currentColor" 
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  className="text-gray-500 dark:text-gray-400"
                />
                <YAxis 
                  stroke="currentColor" 
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={formatYenAxis}
                  className="text-gray-500 dark:text-gray-400"
                />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value) => [value === null ? '--' : `¥${value.toLocaleString()}`, '総支出']}
                />
                {monthlyBudget > 0 && (
                  <ReferenceLine
                    y={monthlyBudget}
                    stroke={BUDGET_COLOR}
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    ifOverflow="extendDomain"
                  />
                )}
                {average !== null && (
                  <ReferenceLine
                    y={average}
                    stroke={AVERAGE_COLOR}
                    strokeDasharray="2 3"
                    strokeWidth={1.5}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="支出"
                  stroke="url(#trendLineGradient)"
                  strokeWidth={3.5}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  dot={{ r: 4, strokeWidth: 1, fill: '#f06292' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 rounded bg-gradient-to-r from-cyan-400 to-pink-400" />
              支出
            </span>
            {monthlyBudget > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: BUDGET_COLOR }} />
                予算 ¥{monthlyBudget.toLocaleString()}
              </span>
            )}
            {average !== null && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 border-t-2 border-dotted" style={{ borderColor: AVERAGE_COLOR }} />
                平均 ¥{Math.round(average).toLocaleString()}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
          支出を記録するとグラフが表示されます。
        </p>
      )}
    </div>
  );
};

export default SpendingTrendCard;
