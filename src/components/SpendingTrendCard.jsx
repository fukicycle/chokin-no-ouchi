import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SpendingTrendCard = ({ data, viewMode = 'month' }) => {
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

  return (
    <div className="w-full text-text-dark dark:text-gray-100">
      <h3 className="text-base font-bold mb-4 tracking-wide uppercase text-gray-500 dark:text-gray-400 text-center">
        {viewMode === 'month' ? '支出の推移 (直近3ヶ月)' : '支出の推移 (年間)'}
      </h3>
      {chartData.length > 0 ? (
        <div className="w-full h-[200px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                formatter={(value) => [`¥${value.toLocaleString()}`, '総支出']}
              />
              <Line 
                type="monotone" 
                dataKey="支出" 
                stroke="#f06292" 
                strokeWidth={3} 
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                dot={{ r: 4, strokeWidth: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
          支出を記録するとグラフが表示されます。
        </p>
      )}
    </div>
  );
};

export default SpendingTrendCard;
