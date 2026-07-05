import React, { useState } from 'react';
import { ref, push, update } from 'firebase/database';
import { database } from '../firebase/config';
import { useCategories } from '../hooks/useCategories';

const ExpenseForm = ({ userId, familyId, onClose, expense = null }) => {
  const [amount, setAmount] = useState(expense ? expense.amount : '');
  const [category, setCategory] = useState(expense ? expense.category : '');
  const [description, setDescription] = useState(expense ? expense.description : '');
  const [date, setDate] = useState(
    expense
      ? new Date(expense.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );

  const { categories, loading: categoriesLoading } = useCategories(familyId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;

    try {
      if (expense) {
        // 編集モード
        const expenseRef = ref(database, `expenses/${familyId}/${expense.id}`);
        await update(expenseRef, {
          amount: Number(amount),
          category,
          description,
          date: new Date(date).toISOString(),
        });
        alert('支出情報を更新しました！');
      } else {
        // 新規追加モード
        const newExpenseRef = ref(database, `expenses/${familyId}`);
        await push(newExpenseRef, {
          amount: Number(amount),
          category,
          description,
          date: new Date(date).toISOString(),
          userId,
        });
      }

      setAmount('');
      setCategory('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('支出の保存に失敗しました:', error);
      alert('保存に失敗しました。');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-text-dark dark:text-gray-100">
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
          カテゴリー
        </label>
        <input
          type="text"
          list="category-options"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="食費、日用品、交際費など"
          required
          className="w-full p-3 bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-accent-pink focus:border-transparent text-text-dark dark:text-white"
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
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
          金額 (円)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="金額を入力してください"
          required
          min="0"
          className="w-full p-3 bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-accent-pink focus:border-transparent text-text-dark dark:text-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
          説明 (任意)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="品名やメモなど"
          className="w-full p-3 bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-accent-pink focus:border-transparent text-text-dark dark:text-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
          利用日
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full p-3 bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-xl text-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-accent-pink focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3.5 text-white font-bold bg-accent-pink dark:bg-pink-600 rounded-xl shadow-lg hover:bg-pink-400 dark:hover:bg-pink-500 active:scale-[0.98] transition-all duration-200"
      >
        {expense ? '変更を保存' : '追加する'}
      </button>
    </form>
  );
};

export default ExpenseForm;
