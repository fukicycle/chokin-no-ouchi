import React, { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faTimes,
  faEdit,
  faTrashAlt,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { useMonthlyExpenses } from "../hooks/useMonthlyExpenses";
import { useAnnualExpenses } from "../hooks/useAnnualExpenses";
import { useAuth } from "../hooks/useAuth";
import { ref, remove } from "firebase/database";
import { database } from "../firebase/config";
import ExpenseForm from "./ExpenseForm";

const ExpenseList = ({ 
  familyId, 
  year, 
  month, 
  onMonthChange, 
  onClose, 
  viewMode = "month",
  initialCategory = "all" 
}) => {
  const { currentUser } = useAuth();
  const today = new Date();

  // 月次と年次のデータをそれぞれ取得
  const { expenses: monthlyExpenses, loading: monthlyLoading } = useMonthlyExpenses(familyId, year, month);
  const { annualExpenses, loading: annualLoading } = useAnnualExpenses(familyId, year);

  const expenses = viewMode === "month" ? monthlyExpenses : annualExpenses;
  const loading = viewMode === "month" ? monthlyLoading : annualLoading;

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // カテゴリーフィルター用ステート (初期値をプロップから取得)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(initialCategory);
  
  // 並べ替えステート ("date" または "amount")
  const [sortBy, setSortBy] = useState("date");

  // プロップが変更された場合にフィルター状態を同期
  useEffect(() => {
    setSelectedCategoryFilter(initialCategory);
  }, [initialCategory]);

  const titleText = useMemo(() => {
    if (viewMode === "month") {
      const date = new Date(year, month - 1);
      return date.toLocaleString("ja-JP", { year: "numeric", month: "long" });
    } else {
      return `${year}年`;
    }
  }, [viewMode, year, month]);

  // 現在の支出データ一覧から一意なカテゴリーを抽出
  const activeCategories = useMemo(() => {
    const cats = new Set(expenses.map((e) => e.category));
    return Array.from(cats);
  }, [expenses]);

  // フィルター ＆ 並べ替えされた支出リスト
  const processedExpenses = useMemo(() => {
    let list = [...expenses];
    
    // 1. カテゴリーフィルター
    if (selectedCategoryFilter !== "all") {
      list = list.filter((e) => e.category === selectedCategoryFilter);
    }
    
    // 2. 並べ替え
    if (sortBy === "date") {
      // 日付の降順 (新しい利用日が上)
      return list.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      // 金額の降順 (高額支出が上)
      return list.sort((a, b) => b.amount - a.amount);
    }
  }, [expenses, selectedCategoryFilter, sortBy]);

  // フィルターされた合計金額
  const filteredTotal = useMemo(() => {
    return processedExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [processedExpenses]);

  const handlePrevious = () => {
    setSelectedCategoryFilter("all"); // 月・年切り替え時にフィルターをリセット
    if (viewMode === "month") {
      const newDate = new Date(year, month - 2);
      onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
    } else {
      onMonthChange(year - 1, month);
    }
  };

  const handleNext = () => {
    setSelectedCategoryFilter("all"); // 月・年切り替え時にフィルターをリセット
    if (viewMode === "month") {
      const newDate = new Date(year, month);
      onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
    } else {
      onMonthChange(year + 1, month);
    }
  };

  const isNextDisabled = useMemo(() => {
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    if (viewMode === "month") {
      return year > todayYear || (year === todayYear && month >= todayMonth);
    } else {
      return year >= todayYear;
    }
  }, [viewMode, year, month]);

  const openDetailsModal = (expense) => {
    setSelectedExpense(expense);
    setIsEditing(false);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedExpense(null);
    setIsEditing(false);
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm("この支出データを本当に削除しますか？")) return;

    try {
      const expenseRef = ref(database, `expenses/${familyId}/${expenseId}`);
      await remove(expenseRef);
      alert("支出データを削除しました。");
      closeDetailsModal();
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました。");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 dark:text-gray-400 py-4">読み込み中...</div>;
  }

  return (
    <div className="relative text-slate-800 dark:text-gray-100">
      {/* ナビゲーター */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevious}
          className="p-2 text-cyan-800 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors duration-200"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <h3 className="text-xl font-bold">{titleText}</h3>
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`p-2 text-cyan-800 dark:text-cyan-400 transition-colors duration-200 ${
            isNextDisabled
              ? "opacity-20 cursor-not-allowed text-gray-400"
              : "hover:text-cyan-600 dark:hover:text-cyan-300"
          }`}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {/* カテゴリーフィルタータグ (横スクロールピルバー) */}
      {expenses.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center space-x-1 px-1 text-slate-500 dark:text-slate-400">
            <FontAwesomeIcon icon={faFilter} className="text-xs" />
            <span className="text-[10px] font-extrabold tracking-wider uppercase">フィルター</span>
          </div>
          
          <div className="flex overflow-x-auto whitespace-nowrap space-x-2 pb-2 -mx-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryFilter("all")}
              className={`px-3 py-1.5 text-xs font-black rounded-full border transition-all duration-150 ${
                selectedCategoryFilter === "all"
                  ? "bg-cyan-800 dark:bg-cyan-500 border-transparent text-white shadow-sm"
                  : "bg-white/35 dark:bg-black/25 border-white/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/50"
              }`}
            >
              すべて
            </button>
            {activeCategories.map((cat, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-black rounded-full border transition-all duration-150 ${
                  selectedCategoryFilter === cat
                    ? "bg-cyan-800 dark:bg-cyan-500 border-transparent text-white shadow-sm"
                    : "bg-white/35 dark:bg-black/25 border-white/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 新設機能: 並べ替えコントローラー (日付順・金額順) */}
          <div className="flex justify-between items-center px-1 py-1 border-t border-b border-slate-300/30 dark:border-slate-700/30 my-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">並べ替え</span>
            <div className="flex bg-white/30 dark:bg-black/25 p-0.5 rounded-lg border border-white/50 dark:border-white/10 shadow-inner">
              <button
                onClick={() => setSortBy("date")}
                className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all duration-150 ${
                  sortBy === "date"
                    ? "bg-cyan-800 dark:bg-cyan-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                日付順
              </button>
              <button
                onClick={() => setSortBy("amount")}
                className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all duration-150 ${
                  sortBy === "amount"
                    ? "bg-cyan-800 dark:bg-cyan-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                金額順
              </button>
            </div>
          </div>

          {/* フィルター合計の表示 */}
          {selectedCategoryFilter !== "all" && (
            <div className="bg-white/20 dark:bg-black/10 border border-white/40 dark:border-white/5 rounded-xl p-2.5 flex justify-between items-center shadow-inner mt-1">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                「{selectedCategoryFilter}」の合計支出
              </span>
              <span className="text-base font-black text-pink-600 dark:text-pink-400">
                ¥{filteredTotal.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 支出データ一覧 */}
      {processedExpenses.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-6">
          {selectedCategoryFilter === "all" 
            ? (viewMode === "month" ? "まだ支出が記録されていません。" : "今年の支出はまだ記録されていません。")
            : "このカテゴリーの支出データは見つかりませんでした。"}
        </div>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {processedExpenses.map((expense) => (
            <li
              key={expense.id}
              onClick={() => openDetailsModal(expense)}
              className="p-4 flex justify-between items-center bg-white/20 dark:bg-black/25 border border-white/30 dark:border-white/5 rounded-2xl shadow-sm cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:bg-white/35 dark:hover:bg-black/35"
            >
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  {new Date(expense.date).toLocaleDateString("ja-JP")}
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {expense.category}
                </span>
                {expense.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                    {expense.description}
                  </p>
                )}
              </div>
              <span className="text-lg font-black text-pink-600 dark:text-pink-400">
                ¥{expense.amount.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* 支出詳細・編集モーダル */}
      {detailsModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div
            className="glass-modal w-full max-w-md mx-4 p-6 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 text-text-dark dark:text-gray-100 transform transition-transform duration-300"
            style={{ animation: `modal-in 0.3s forwards` }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {isEditing ? "支出の編集" : "支出詳細"}
              </h3>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faTimes} className="text-2xl" />
              </button>
            </div>

            {isEditing ? (
              <ExpenseForm
                userId={currentUser?.uid}
                familyId={familyId}
                expense={selectedExpense}
                onClose={closeDetailsModal}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">金額</span>
                  <span className="text-3xl font-black text-pink-600 dark:text-pink-400">
                    ¥{selectedExpense.amount.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">カテゴリ</span>
                    <span className="text-base font-bold text-slate-800 dark:text-white">{selectedExpense.category}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">日付</span>
                    <span className="text-base font-bold text-slate-800 dark:text-white">
                      {new Date(selectedExpense.date).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                </div>

                {selectedExpense.description && (
                  <div className="flex flex-col space-y-1 bg-white/25 dark:bg-black/20 p-3 rounded-xl border border-white/40 dark:border-white/5">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">説明</span>
                    <p className="text-sm break-words whitespace-pre-wrap text-slate-700 dark:text-slate-200 font-medium">{selectedExpense.description}</p>
                  </div>
                )}

                {/* 編集・削除ボタン (高コントラスト設計) */}
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-3 bg-cyan-100 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/10 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-200/60 dark:hover:bg-cyan-900/40 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 active:scale-[0.98]"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>編集</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedExpense.id)}
                    className="flex-1 py-3 bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-800/10 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 active:scale-[0.98]"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} />
                    <span>削除</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
