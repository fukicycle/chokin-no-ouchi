import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A442F2', '#F242F2'];

const SummaryChart = ({ expenses }) => {
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
    <div className="flex flex-col items-center">
      <h3 className="text-4xl font-bold text-text-dark mb-2">¥{totalAmount.toLocaleString()}</h3>
      <p className="text-sm text-gray-600 mb-4">今月の合計支出</p>
      
      <div className="w-full h-40">
        {categoryData.length > 0 ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`¥${value.toLocaleString()}`, name]} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-600">支出を記録するとグラフが表示されます。</div>
        )}
      </div>
      
      {/* レジェンドの追加 */}
      {categoryData.length > 0 && (
        <div className="flex flex-wrap justify-center mt-4">
          {categoryData.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center mx-2 my-1">
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
              <span className="text-sm text-gray-700">{entry.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SummaryChart;