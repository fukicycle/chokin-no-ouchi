import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { database } from "../firebase/config";
import { useCategories } from "../hooks/useCategories";
import { useGeminiApiKey } from "../hooks/useGeminiApiKey";
import { extractReceiptData, waitBetweenRequests } from "../services/geminiReceipt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";

let itemIdCounter = 0;
const nextId = () => `receipt-${Date.now()}-${itemIdCounter++}`;

const ReceiptScanForm = ({ userId, familyId, onClose }) => {
  const { categories } = useCategories(familyId);
  const { apiKey } = useGeminiApiKey();
  const [items, setItems] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  // レートリミット対策として並列送信は避け、1件ずつ間隔を空けて直列処理する
  const processQueue = async (queueItems) => {
    setIsProcessingQueue(true);
    for (let i = 0; i < queueItems.length; i++) {
      const item = queueItems[i];
      updateItem(item.id, { status: "processing", error: null });
      try {
        const result = await extractReceiptData(apiKey, item.file, { categories });
        updateItem(item.id, {
          status: "done",
          data: {
            date: result.date || new Date().toISOString().slice(0, 10),
            category: result.category || "",
            amount: result.amount ? String(result.amount) : "",
            description: [result.storeName, ...(result.items || []).map((it) => it.name)]
              .filter(Boolean)
              .join(" / "),
          },
        });
      } catch (error) {
        console.error("レシート解析に失敗しました:", error);
        updateItem(item.id, { status: "error", error: error.message || "解析に失敗しました。" });
      }

      if (i < queueItems.length - 1) {
        await waitBetweenRequests();
      }
    }
    setIsProcessingQueue(false);
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    if (!apiKey) {
      alert("設定画面でGemini APIキーを登録してください。");
      return;
    }

    const newItems = files.map((file) => ({
      id: nextId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
      error: null,
      data: null,
    }));

    setItems((prev) => [...prev, ...newItems]);
    processQueue(newItems);
  };

  const handleFieldChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, data: { ...it.data, [field]: value } } : it))
    );
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleRetryItem = (id) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    processQueue([item]);
  };

  const readyItems = items.filter((it) => it.status === "done" && it.data);

  const handleSaveAll = async () => {
    const validItems = readyItems.filter((it) => it.data.amount && it.data.category);
    if (validItems.length === 0) {
      alert("金額とカテゴリーが入力された項目がありません。");
      return;
    }

    setIsSavingAll(true);
    try {
      for (const item of validItems) {
        const { date, category, amount, description } = item.data;
        const newExpenseRef = ref(database, `expenses/${familyId}`);
        await push(newExpenseRef, {
          amount: Number(amount),
          category,
          description,
          date: new Date(date).toISOString(),
          userId,
        });
      }
      alert(`${validItems.length}件の支出を登録しました！`);
      onClose();
    } catch (error) {
      console.error("レシートの保存に失敗しました:", error);
      alert("保存に失敗しました。");
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="space-y-4 text-text-dark dark:text-gray-100">
      {!apiKey && (
        <div className="p-3 bg-amber-100/60 dark:bg-amber-950/30 border border-amber-300/50 dark:border-amber-800/30 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300">
          レシート読み取りには Gemini APIキーが必要です。設定画面から登録してください。
        </div>
      )}

      <label
        className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-2xl transition-all duration-200 ${
          apiKey
            ? "cursor-pointer border-cyan-800/30 dark:border-cyan-400/20 hover:bg-white/20 dark:hover:bg-black/10"
            : "border-gray-300 dark:border-gray-700 opacity-50 cursor-not-allowed"
        }`}
      >
        <FontAwesomeIcon icon={faCamera} className="text-2xl text-cyan-800 dark:text-cyan-400" />
        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
          レシートを撮影 / 画像を選択（複数可）
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          disabled={!apiKey}
          onChange={handleFilesSelected}
          className="hidden"
        />
      </label>

      {items.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-white/25 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl space-y-2"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={item.previewUrl}
                  alt="レシート"
                  className="w-14 h-14 object-cover rounded-lg border border-white/40 dark:border-white/10"
                />
                <div className="flex-1 min-w-0">
                  {item.status === "processing" && (
                    <span className="flex items-center space-x-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-400">
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>解析中...</span>
                    </span>
                  )}
                  {item.status === "pending" && (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">待機中...</span>
                  )}
                  {item.status === "done" && (
                    <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>解析完了 - 内容を確認してください</span>
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="flex items-center space-x-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      <span className="truncate">{item.error}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  {item.status === "error" && (
                    <button
                      type="button"
                      onClick={() => handleRetryItem(item.id)}
                      className="text-xs font-bold text-cyan-800 dark:text-cyan-400 hover:underline"
                    >
                      再試行
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} />
                  </button>
                </div>
              </div>

              {item.status === "done" && item.data && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/30 dark:border-white/5">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      カテゴリー
                    </label>
                    <input
                      type="text"
                      list="receipt-category-options"
                      value={item.data.category}
                      onChange={(e) => handleFieldChange(item.id, "category", e.target.value)}
                      className="w-full p-2 text-base bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-800 dark:focus:ring-cyan-400"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      金額 (円)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.data.amount}
                      onChange={(e) => handleFieldChange(item.id, "amount", e.target.value)}
                      className="w-full p-2 text-base bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-800 dark:focus:ring-cyan-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      説明
                    </label>
                    <input
                      type="text"
                      value={item.data.description}
                      onChange={(e) => handleFieldChange(item.id, "description", e.target.value)}
                      className="w-full p-2 text-base bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-800 dark:focus:ring-cyan-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      利用日
                    </label>
                    <input
                      type="date"
                      value={item.data.date}
                      onChange={(e) => handleFieldChange(item.id, "date", e.target.value)}
                      className="w-full p-2 text-base bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-800 dark:focus:ring-cyan-400"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <datalist id="receipt-category-options">
        {categories.map((cat, index) => (
          <option key={index} value={cat} />
        ))}
      </datalist>

      {readyItems.length > 0 && (
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSavingAll || isProcessingQueue}
          className="w-full py-3.5 text-white font-bold bg-accent-pink dark:bg-pink-600 rounded-xl shadow-lg hover:bg-pink-400 dark:hover:bg-pink-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
        >
          {isSavingAll ? "保存中..." : `確認した${readyItems.length}件を保存する`}
        </button>
      )}
    </div>
  );
};

export default ReceiptScanForm;
