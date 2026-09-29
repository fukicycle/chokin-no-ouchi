import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRepeat, faPlus, faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hooks/useAuth";
import { useFixedCosts } from "../hooks/useFixedCosts";

const EMPTY_FORM = { name: "", category: "", amount: "", dayOfMonth: "1" };
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

const inputClass =
  "w-full p-2.5 bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-800 dark:focus:ring-cyan-400 focus:border-transparent text-slate-800 dark:text-white text-base";

/**
 * 設定タブ: 毎月の固定費 (家賃・サブスク・保険など) の登録。
 * 登録した固定費は毎月1回、支出として自動計上される (useFixedCostSync)。
 */
const FixedCostSettings = ({ familyId, categories }) => {
  const { currentUser } = useAuth();
  const { fixedCosts, loading, addFixedCost, updateFixedCost, removeFixedCost } = useFixedCosts(familyId);

  // null: フォーム非表示 / "new": 追加 / 固定費オブジェクト: 編集
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  // 追加時は「今月分から計上」、編集時は「今月計上済みの支出にも反映」の意味で使う
  const [applyThisMonth, setApplyThisMonth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const monthlyTotal = useMemo(
    () => fixedCosts.reduce((sum, f) => sum + (Number(f.amount) || 0), 0),
    [fixedCosts]
  );

  const openNewForm = () => {
    setEditing("new");
    setForm(EMPTY_FORM);
    setApplyThisMonth(true);
  };

  const openEditForm = (fixedCost) => {
    setEditing(fixedCost);
    setForm({
      name: fixedCost.name || "",
      category: fixedCost.category || "",
      amount: String(fixedCost.amount ?? ""),
      dayOfMonth: String(fixedCost.dayOfMonth || 1),
    });
    setApplyThisMonth(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim() || !form.amount) return;

    setIsSaving(true);
    try {
      if (editing === "new") {
        await addFixedCost(form, { userId: currentUser?.uid, includeCurrentMonth: applyThisMonth });
        alert(
          applyThisMonth
            ? `固定費「${form.name.trim()}」を登録し、今月分を支出に計上しました。`
            : `固定費「${form.name.trim()}」を登録しました。来月分から自動で計上されます。`
        );
      } else {
        await updateFixedCost(editing, form, {
          userId: currentUser?.uid,
          applyToCurrentMonth: applyThisMonth,
        });
        alert(`固定費「${form.name.trim()}」を更新しました。`);
      }
      closeForm();
    } catch (error) {
      console.error("固定費の保存に失敗しました:", error);
      alert("固定費の保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (fixedCost) => {
    if (
      !window.confirm(
        `固定費「${fixedCost.name}」を削除しますか？\n来月以降は自動で計上されなくなります。計上済みの過去の支出は履歴に残ります。`
      )
    ) {
      return;
    }
    try {
      await removeFixedCost(fixedCost.id);
      if (editing && editing !== "new" && editing.id === fixedCost.id) closeForm();
    } catch (error) {
      console.error("固定費の削除に失敗しました:", error);
      alert("固定費の削除に失敗しました。");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faRepeat} className="text-cyan-800 dark:text-cyan-400 text-base" />
          <h4 className="text-sm font-bold">毎月の固定費</h4>
        </div>
        {fixedCosts.length > 0 && (
          <span className="text-xs font-black text-slate-700 dark:text-slate-200">
            月 ¥{monthlyTotal.toLocaleString()}
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
        家賃・通信費・サブスクなど毎月決まってかかる支出を登録すると、毎月はじめにアプリを開いたとき自動で支出に計上されます。金額が変わった月は履歴から個別に編集できます。
      </p>

      {loading ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">読み込み中...</p>
      ) : (
        fixedCosts.length > 0 && (
          <ul className="space-y-2">
            {fixedCosts.map((fixedCost) => (
              <li
                key={fixedCost.id}
                className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white/25 dark:bg-black/15 border border-white/30 dark:border-white/5 rounded-xl"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {fixedCost.name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {fixedCost.category} ・ 毎月{fixedCost.dayOfMonth}日
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-black text-pink-600 dark:text-pink-400 mr-1">
                    ¥{Number(fixedCost.amount || 0).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditForm(fixedCost)}
                    className="p-2 text-cyan-800 dark:text-cyan-400 hover:bg-white/40 dark:hover:bg-white/5 rounded-lg transition-colors"
                    title="編集"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(fixedCost)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-white/40 dark:hover:bg-white/5 rounded-lg transition-colors"
                    title="削除"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {editing ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 bg-white/20 dark:bg-black/10 border border-white/40 dark:border-white/5 p-3.5 rounded-2xl"
        >
          <p className="text-xs font-black text-slate-700 dark:text-slate-200">
            {editing === "new" ? "固定費を追加" : "固定費を編集"}
          </p>
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
              名前
            </label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="例: 家賃、スマホ代、Netflix"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
              カテゴリー
            </label>
            <input
              type="text"
              list="fixed-cost-categories"
              value={form.category}
              onChange={handleChange("category")}
              placeholder="例: 住居費、通信費、サブスク"
              required
              className={inputClass}
            />
            <datalist id="fixed-cost-categories">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                金額 (円)
              </label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={handleChange("amount")}
                placeholder="例: 80000"
                required
                className={inputClass}
              />
            </div>
            <div className="w-28 shrink-0">
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                支払日
              </label>
              <select value={form.dayOfMonth} onChange={handleChange("dayOfMonth")} className={inputClass}>
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d} className="text-slate-800 dark:text-black">
                    {d === 31 ? "月末" : `${d}日`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={applyThisMonth}
              onChange={(e) => setApplyThisMonth(e.target.checked)}
              className="w-4 h-4 accent-cyan-700"
            />
            {editing === "new" ? "今月分から計上する" : "今月計上済みの支出にも反映する"}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="flex-1 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl transition-all active:scale-[0.98]"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-cyan-800 dark:bg-cyan-700 rounded-xl shadow-md hover:bg-cyan-900 dark:hover:bg-cyan-600 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? "保存中..." : editing === "new" ? "登録" : "保存"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={openNewForm}
          disabled={!familyId}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-cyan-800 dark:text-cyan-300 border border-dashed border-cyan-800/40 dark:border-cyan-400/30 rounded-xl hover:bg-white/30 dark:hover:bg-white/5 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>固定費を追加</span>
        </button>
      )}
    </div>
  );
};

export default FixedCostSettings;
