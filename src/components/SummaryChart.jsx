import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// 洗練されたグラスモルフィズムに調和するプレミアム・カラーパレット
const COLORS = ['#38bdf8', '#f06292', '#34d399', '#fbbf24', '#818cf8', '#f43f5e', '#a78bfa'];

const SummaryChart = ({ expenses, viewMode = 'month' }) => {
  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const categoryData = useMemo(() => {
    const categories = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    
    return Object.keys(categories).map(category => ({
      name: category,
      value: categories[category],
    }));
  }, [expenses]);

  return (
    <div className="flex flex-col items-center justify-center p-2 text-text-dark dark:text-gray-100">
      <h3 className="text-4xl font-extrabold text-text-dark dark:text-white tracking-tight mb-1">
        ¥{totalAmount.toLocaleString()}
      </h3>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider">
        {viewMode === 'month' ? '今月の合計支出' : '今年の合計支出'}
      </p>
      
      <div className="w-full h-44 relative flex items-center justify-center">
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                fill="#8884d8"
                paddingAngle={4}
                dataKey="value"
                labelLine={false}
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
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            支出を記録するとグラフが表示されます。
          </div>
        )}
      </div>
      
      {/* レジェンドの追加 */}
      {categoryData.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 max-h-24 overflow-y-auto w-full px-2">
          {categoryData.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center space-x-1.5 bg-white/20 dark:bg-black/10 px-2.5 py-1 rounded-full border border-white/30 dark:border-white/5 shadow-sm text-xs font-medium">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
              <span className="text-gray-700 dark:text-gray-300">{entry.name}</span>
              <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                ({Math.round((entry.value / totalAmount) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SummaryChart;
