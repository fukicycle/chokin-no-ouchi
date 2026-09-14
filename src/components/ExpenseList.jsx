import React, { useState, useMemo, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
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
import Modal from "./Modal";

const ExpenseList = ({ 
  familyId, 
  year, 
  month, 
  viewMode = "month",
  initialCategory = "all" 
}) => {
  const { currentUser } = useAuth();

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

  // 表示期間が変わったらカテゴリーフィルターをリセット。
  // 初回マウント時は initialCategory を上書きしないようスキップする。
  const isFirstPeriodRender = useRef(true);
  useEffect(() => {
    if (isFirstPeriodRender.current) {
      isFirstPeriodRender.current = false;
      return;
    }
    setSelectedCategoryFilter("all");
  }, [year, month, viewMode]);

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
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
        読み込み中...
      </div>
    );
  }

  return (
    // 親(HistoryView)の高さを使い切り、フィルター/並べ替えは固定、
    // 明細リスト(下の flex-1 min-h-0 の領域)だけをスクロールさせる。
    <div className="relative h-full min-h-0 flex flex-col text-slate-800 dark:text-gray-100">
      {/* カテゴリーフィルタータグ (横スクロールピルバー) — 固定ヘッダー */}
      {expenses.length > 0 && (
        <div className="space-y-2 mb-3 shrink-0">
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

      {/* 支出データ一覧 — ここだけが独立してスクロールする */}
      {processedExpenses.length === 0 ? (
        <div className="flex-1 min-h-0 flex items-center justify-center text-center text-gray-500 dark:text-gray-400 py-6">
          {selectedCategoryFilter === "all"
            ? (viewMode === "month" ? "まだ支出が記録されていません。" : "今年の支出はまだ記録されていません。")
            : "このカテゴリーの支出データは見つかりませんでした。"}
        </div>
      ) : (
        // ホバー時の scale がはみ出して横スクロールが出ないよう左右に余白を確保する
        <ul className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain space-y-3 px-1 -mx-1 pb-1">
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
        <Modal
          onClose={closeDetailsModal}
          title={isEditing ? "支出の編集" : "支出詳細"}
        >
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
        </Modal>
      )}
    </div>
  );
};

export default ExpenseList;
