// src/components/SettingModal.jsx
import React, { useState } from "react";
import { ref, update, get } from "firebase/database";
import { database } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { useCategories } from "../hooks/useCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faUserFriends, faTags, faExchangeAlt } from "@fortawesome/free-solid-svg-icons";

const SettingModal = ({ familyId, onClose }) => {
  const { currentUser } = useAuth();
  const [newFamilyId, setNewFamilyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // カテゴリー管理用ステート
  const { categories, loading: categoriesLoading } = useCategories(familyId);
  const [oldCategory, setOldCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  const handleCopy = () => {
    if (familyId) {
      navigator.clipboard.writeText(familyId);
      alert("ファミリーIDがクリップボードにコピーされました！");
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    if (!newFamilyId.trim() || !currentUser) return;

    const cleanedId = newFamilyId.trim().toUpperCase();

    if (cleanedId === familyId) {
      alert("すでにこのファミリーに参加しています。");
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = ref(database, `users/${currentUser.uid}`);
      await update(userRef, {
        familyId: cleanedId,
      });
      alert(`ファミリーID「${cleanedId}」の家族に参加しました！`);
      setNewFamilyId("");
      if (onClose) onClose();
    } catch (error) {
      console.error("ファミリー参加エラー:", error);
      alert("参加に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // カテゴリーの統合・整理処理 (Firebase上の対象データを一括置換)
  const handleMergeCategories = async (e) => {
    e.preventDefault();
    if (!oldCategory || !newCategory.trim() || !familyId) return;

    const cleanNewCategory = newCategory.trim();

    if (oldCategory === cleanNewCategory) {
      alert("変更前と変更後のカテゴリー名が同じです。");
      return;
    }

    if (
      !window.confirm(
        `【カテゴリーの一括統合】\n「${oldCategory}」に登録されているすべての支出を「${cleanNewCategory}」に書き換えますか？\nこの操作は元に戻せません。`
      )
    ) {
      return;
    }

    setIsMerging(true);
    try {
      const expensesRef = ref(database, `expenses/${familyId}`);
      const snapshot = await get(expensesRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const updates = {};
        let count = 0;

        Object.keys(data).forEach((key) => {
          if (data[key].category === oldCategory) {
            updates[`expenses/${familyId}/${key}/category`] = cleanNewCategory;
            count++;
          }
        });

        if (count > 0) {
          // マルチパスアップデートで原子的に一括置換
          await update(ref(database), updates);
          alert(`${count}件の支出カテゴリーを「${oldCategory}」から「${cleanNewCategory}」へ一括統合しました！`);
          setOldCategory("");
          setNewCategory("");
          if (onClose) onClose();
        } else {
          alert(`「${oldCategory}」に該当する支出データが見つかりませんでした。`);
        }
      } else {
        alert("支出データが登録されていません。");
      }
    } catch (error) {
      console.error("カテゴリー統合エラー:", error);
      alert("統合処理に失敗しました。データベース権限を確認してください。");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="p-2 space-y-6 text-text-dark dark:text-gray-100 max-h-[80vh] overflow-y-auto pr-1">
      
      {/* 1. ファミリーID表示とコピー */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          あなたの現在のファミリーID
        </h4>
        <div className="flex items-center justify-between p-3 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl shadow-inner">
          <p className="text-xl font-mono font-bold tracking-wide break-all flex-grow mr-2 select-all">
            {familyId || "---"}
          </p>
          <button
            onClick={handleCopy}
            className="p-2.5 text-cyan-800 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors duration-200 bg-white/50 dark:bg-white/5 rounded-xl hover:scale-105 active:scale-95 transform"
            disabled={!familyId}
            title="IDをコピー"
          >
            <FontAwesomeIcon icon={faCopy} className="text-lg" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
          このIDを家族メンバーに共有すると、同じ家計簿を共有して管理できます。
        </p>
      </div>

      {/* 境界線 */}
      <div className="border-t border-white/30 dark:border-white/5 my-4" />

      {/* 2. 別の家族に参加 */}
      <form onSubmit={handleJoinFamily} className="space-y-3">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faUserFriends} className="text-cyan-800 dark:text-cyan-400 text-base" />
          <h4 className="text-sm font-bold">既存の家族に参加する</h4>
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={newFamilyId}
            onChange={(e) => setNewFamilyId(e.target.value)}
            placeholder="家族のファミリーIDを入力"
            maxLength={12}
            required
            className="w-full p-3 bg-white/20 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-800 dark:focus:ring-cyan-400 focus:border-transparent dark:text-white text-sm"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newFamilyId.trim()}
            className="w-full py-3 text-white font-bold bg-cyan-800 dark:bg-cyan-700 rounded-xl shadow-md transition-all duration-200 hover:bg-cyan-900 dark:hover:bg-cyan-600 active:scale-[0.98] transform disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? "参加中..." : "ファミリーに参加"}
          </button>
        </div>
      </form>

      {/* 境界線 */}
      <div className="border-t border-white/30 dark:border-white/5 my-4" />

      {/* 3. 新設機能: カテゴリーの整理・一括統合 */}
      <form onSubmit={handleMergeCategories} className="space-y-3">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faTags} className="text-pink-600 dark:text-pink-400 text-base" />
          <h4 className="text-sm font-bold">カテゴリーの整理・一括統合</h4>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
          誤って作成された類似カテゴリー（例: 「外食」と「ご飯」）を一つに統合できます。変更元の支出がすべて自動で書き換わります。
        </p>

        <div className="space-y-3 bg-white/20 dark:bg-black/10 border border-white/40 dark:border-white/5 p-3.5 rounded-2xl">
          {/* 変更元カテゴリー選択 */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
              統合したいカテゴリー（元）
            </label>
            <select
              value={oldCategory}
              onChange={(e) => setOldCategory(e.target.value)}
              required
              className="w-full p-2.5 bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="" className="text-gray-500">カテゴリーを選択してください</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat} className="text-slate-800 dark:text-black">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 統合方向表示 */}
          <div className="flex justify-center text-slate-400 dark:text-slate-500">
            <FontAwesomeIcon icon={faExchangeAlt} className="rotate-90 md:rotate-0 text-base" />
          </div>

          {/* 変更先カテゴリー指定 */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
              統合先のカテゴリー（新）
            </label>
            <input
              type="text"
              list="existing-categories"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="新しい名前、または既存カテゴリーを選択"
              required
              className="w-full p-2.5 bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white text-sm"
            />
            {/* サジェストリスト */}
            <datalist id="existing-categories">
              {categories.map((cat, index) => (
                <option key={index} value={cat} />
              ))}
            </datalist>
          </div>

          <button
            type="submit"
            disabled={isMerging || !oldCategory || !newCategory.trim()}
            className="w-full py-3 mt-1 text-white font-bold bg-pink-600 dark:bg-pink-700 rounded-xl shadow-md transition-all duration-200 hover:bg-pink-700 dark:hover:bg-pink-600 active:scale-[0.98] transform disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
          >
            {isMerging ? (
              <span>統合処理中...</span>
            ) : (
              <>
                <FontAwesomeIcon icon={faExchangeAlt} />
                <span>カテゴリーを統合・一括変更</span>
              </>
            )}
          </button>
        </div>
      </form>

    </div>
  );
};

export default SettingModal;
