import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SpendingTrendCard = ({ data }) => {
  const chartData = data.map(item => ({
    name: `${new Date(item.month).getMonth() + 1}月`,
    支出: item.total,
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-text-dark text-center">支出の推移</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="name" stroke="#555" />
            <YAxis stroke="#555" />
            <Tooltip />
            <Line type="monotone" dataKey="支出" stroke="#f06292" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-sm text-gray-600">支出を記録するとグラフが表示されます。</p>
      )}
    </div>
  );
};

export default SpendingTrendCard;