import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useMonthlyExpenses } from "../hooks/useMonthlyExpenses";

const ExpenseList = ({ familyId, year, month, onMonthChange }) => {
  const { expenses, loading } = useMonthlyExpenses(familyId, year, month);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const today = new Date();

  const monthName = useMemo(() => {
    const date = new Date(year, month - 1);
    return date.toLocaleString("ja-JP", { year: "numeric", month: "long" });
  }, [year, month]);

  const handlePreviousMonth = () => {
    const newDate = new Date(year, month - 2);
    onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month);
    onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const isNextMonthDisabled = useMemo(() => {
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    return year > todayYear || (year === todayYear && month >= todayMonth);
  }, [year, month]);

  const openDetailsModal = (expense) => {
    setSelectedExpense(expense);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedExpense(null);
  };

  if (loading) {
    return <div className="text-center text-gray-600">読み込み中...</div>;
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-2 text-accent-blue hover:text-blue-500 transition-colors duration-200"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <h3 className="text-xl font-semibold">{monthName}</h3>
        <button
          onClick={handleNextMonth}
          disabled={isNextMonthDisabled}
          className={`p-2 text-accent-blue transition-colors duration-200 ${
            isNextMonthDisabled
              ? "opacity-30 cursor-not-allowed"
              : "hover:text-blue-500"
          }`}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center text-gray-600">
          まだ支出が記録されていません。
        </div>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              onClick={() => openDetailsModal(expense)}
              className="p-3 flex justify-between items-center bg-bg-secondary/50 rounded-lg shadow-sm cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500">
                  {new Date(expense.date).toLocaleDateString("ja-JP")}
                </span>
                <span className="text-sm font-semibold text-text-dark">
                  {expense.category}
                </span>
                {expense.description && (
                  <p className="text-xs text-gray-600 mt-1 max-w-[150px] truncate">
                    {expense.description}
                  </p>
                )}
              </div>
              <span className="text-lg font-bold text-accent-pink">
                ¥{expense.amount}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* 支出詳細モーダルをExpenseList内に直接定義 */}
      {detailsModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300">
          <div
            className="bg-bg-secondary w-full max-w-md mx-4 p-6 rounded-3xl shadow-2xl border border-white/20 transform transition-transform duration-300"
            style={{ animation: `modal-in 0.3s forwards` }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">支出詳細</h3>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faTimes} className="text-2xl" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-2xl font-bold text-accent-pink">
                ¥{selectedExpense.amount}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">カテゴリ: </span>
                {selectedExpense.category}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">日付: </span>
                {new Date(selectedExpense.date).toLocaleDateString("ja-JP")}
              </p>
              {selectedExpense.description && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">説明: </span>
                  {selectedExpense.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
