import React, { useState } from 'react';
import { ref, push } from 'firebase/database';
import { database } from '../firebase/config';
import { useCategories } from '../hooks/useCategories';

const ExpenseForm = ({ userId, familyId, onClose }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const { categories, loading: categoriesLoading } = useCategories(familyId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;

    try {
      const newExpenseRef = ref(database, `expenses/${familyId}`);
      await push(newExpenseRef, {
        amount: Number(amount),
        category,
        description,
        date: new Date(date).toISOString(),
        userId,
      });

      setAmount('');
      setCategory('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('支出の追加に失敗しました:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* ... その他の入力フィールドは省略 */}
      <input
        type="text"
        list="category-options"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="カテゴリー"
        required
        className="w-full p-3 bg-bg-secondary/50 border border-white/50 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue"
      />
      {categoriesLoading ? (
        <datalist id="category-options">
          <option value="読み込み中..." />
        </datalist>
      ) : (
        <datalist id="category-options">
          {categories.map((cat, index) => (
            <option key={index} value={cat} />
          ))}
        </datalist>
      )}
      {/* ... その他の入力フィールドとボタンは省略 */}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="金額"
        required
        className="w-full p-3 bg-bg-secondary/50 border border-white/50 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="説明（任意）"
        className="w-full p-3 bg-bg-secondary/50 border border-white/50 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        className="w-full p-3 bg-bg-secondary/50 border border-white/50 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-blue"
      />
      <button type="submit" className="w-full py-3 text-white font-semibold bg-accent-pink rounded-lg shadow-md transition-colors duration-200 hover:bg-pink-400">
        追加
      </button>
    </form>
  );
};

export default ExpenseForm;