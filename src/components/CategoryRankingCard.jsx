import React, { useMemo } from 'react';

const CategoryRankingCard = ({ expenses }) => {
  const rankingData = useMemo(() => {
    const categories = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [expenses]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-text-dark">カテゴリー別ランキング</h3>
      <ul className="space-y-2">
        {rankingData.length > 0 ? (
          rankingData.map(([category, amount], index) => (
            <li key={index} className="flex justify-between items-center text-gray-700">
              <span className="font-medium">{index + 1}. {category}</span>
              <span className="font-bold text-accent-pink">¥{amount.toLocaleString()}</span>
            </li>
          ))
        ) : (
          <p className="text-center text-sm text-gray-600">支出を記録すると表示されます。</p>
        )}
      </ul>
    </div>
  );
};

export default CategoryRankingCard;