// src/components/SettingModal.jsx
import React, { useState, useEffect } from "react";
import { ref, update, get, onValue } from "firebase/database";
import { database } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { useCategories } from "../hooks/useCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faUserFriends, faTags, faExchangeAlt, faBell } from "@fortawesome/free-solid-svg-icons";

const SettingModal = ({ familyId, onClose }) => {
  const { currentUser } = useAuth();
  const [newFamilyId, setNewFamilyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // カテゴリー管理用ステート
  const { categories, loading: categoriesLoading } = useCategories(familyId);
  const [oldCategory, setOldCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  // 通知リマインダー用ステート
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // VAPID パブリックキー (プッシュサーバー認証用)
  const VAPID_PUBLIC_KEY = "BBIgzrCk48RRt-Ysq1lllDEh_yd20_s9bm5ayoFi0clf-fcuhC3iDCEvUO2D_DgZequD6YavrylDkxWfDKo0c9w";

  useEffect(() => {
    if (!currentUser) return;
    const subRef = ref(database, `users/${currentUser.uid}/pushSubscription`);
    const unsubscribe = onValue(subRef, (snapshot) => {
      setHasSubscription(snapshot.exists());
      setLoadingSubscription(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

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

  // Base64 VAPIDキーの変換用ヘルパー
  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // 22時の通知トグル処理
  const handleToggleNotification = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("お使いのブラウザはプッシュ通知に対応していません。");
      return;
    }

    if (hasSubscription) {
      // 解除処理
      if (!window.confirm("毎日22時の入力忘れリマインダー通知を解除しますか？")) return;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        const userRef = ref(database, `users/${currentUser.uid}`);
        await update(userRef, {
          pushSubscription: null
        });
        alert("リマインダー通知を解除しました。");
      } catch (error) {
        console.error("通知解除エラー:", error);
        alert("通知の解除に失敗しました。");
      }
    } else {
      // 登録処理
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("通知権限が許可されませんでした。ブラウザの設定から通知を許可して再試行してください。");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        
        // VAPIDキーを用いてプッシュ購読を作成
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Firebaseにシリアライズした購読オブジェクトを保存
        const userRef = ref(database, `users/${currentUser.uid}`);
        await update(userRef, {
          pushSubscription: subscription.toJSON()
        });

        alert("毎日22時のリマインダー通知をオンにしました！");
      } catch (error) {
        console.error("通知登録エラー:", error);
        alert(
          "リマインダーの登録に失敗しました。\niPhoneをお使いの場合は、まずこのアプリを「ホーム画面に追加」して起動したかご確認ください。"
        );
      }
    }
  };

  // カテゴリーの統合・整理処理
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
          await update(ref(database), updates);
          alert(`${count}件 of 支出カテゴリーを「${oldCategory}」から「${cleanNewCategory}」へ一括統合しました！`);
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

      {/* 3. 新設機能: 22時のリマインダー通知設定 (Web Push完全自律動作) */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faBell} className="text-amber-500 dark:text-amber-400 text-base" />
          <h4 className="text-sm font-bold">入力忘れ防止リマインダー</h4>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
          毎日22時に、今日の支出を登録したか確認するリマインダープッシュ通知を送ります（すでに登録済みの日は自動で間引きされます）。
        </p>

        <div className="flex items-center justify-between p-3.5 bg-white/20 dark:bg-black/10 border border-white/40 dark:border-white/5 rounded-2xl shadow-inner">
          <div className="flex flex-col space-y-0.5">
            <span className="text-xs font-bold">22時のデイリーリマインダー</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              {loadingSubscription ? "確認中..." : hasSubscription ? "リマインダー：オン" : "リマインダー：オフ"}
            </span>
          </div>

          <button
            onClick={handleToggleNotification}
            disabled={loadingSubscription}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all duration-200 shadow-md ${
              hasSubscription
                ? "bg-red-500/10 dark:bg-red-950/30 border border-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-500/20"
                : "bg-cyan-800 dark:bg-cyan-600 text-white hover:bg-cyan-900 dark:hover:bg-cyan-500"
            } active:scale-95 disabled:opacity-50`}
          >
            {loadingSubscription ? "読み込み中" : hasSubscription ? "オフにする" : "オンにする"}
          </button>
        </div>
      </div>

      {/* 境界線 */}
      <div className="border-t border-white/30 dark:border-white/5 my-4" />

      {/* 4. カテゴリーの整理・一括統合 */}
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
