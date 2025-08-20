import React from 'react';

const SavingGoalCard = ({ goalAmount, currentSavings }) => {
  const progress = goalAmount > 0 ? (currentSavings / goalAmount) * 100 : 0;
  const formattedProgress = Math.min(Math.round(progress), 100);

  return (
    <div className="p-4 bg-translucent-light backdrop-blur-md border border-white/20 rounded-3xl shadow-lg text-center">
      <h3 className="text-lg font-semibold mb-2 text-text-dark">貯金目標</h3>
      <p className="text-sm text-gray-600 mb-2">目標金額：¥{goalAmount.toLocaleString()}</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className="bg-accent-blue h-2.5 rounded-full"
          style={{ width: `${formattedProgress}%` }}
        ></div>
      </div>
      <p className="text-xl font-bold text-accent-blue">
        {formattedProgress}%
      </p>
      <p className="text-sm text-gray-600">現在：¥{currentSavings.toLocaleString()}</p>
    </div>
  );
};

export default SavingGoalCard;