// カテゴリーの整理：似たカテゴリー（「外食」と「ご飯」など）を一つにまとめる。
// 元のカテゴリーの支出と固定費が、すべて書き換わる（取り消せないので確認を挟む）。
import { useState, type FormEvent } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { mergeCategory } from "../../data/familyData";
import { useCategories } from "../../data/hooks";
import { useFeedback } from "../../ui/Feedback";

export function CategoriesScreen() {
  const { familyId } = useAuth();
  const categories = useCategories();
  const { confirm, toast } = useFeedback();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const target = to.trim();
    if (!familyId || !from || !target) return;
    if (from === target) return toast({ message: "まとめる前と後が同じカテゴリーです" });
    const ok = await confirm({
      title: `「${from}」を「${target}」にまとめますか？`,
      message: `「${from}」の支出と固定費が、すべて「${target}」に変わります。この操作は取り消せません。`,
      confirmLabel: "まとめる",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const count = await mergeCategory(familyId, from, target);
      toast({ message: `${count}件を「${target}」にまとめました` });
      setFrom("");
      setTo("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="page form" onSubmit={submit}>
      <p className="lead">
        似たカテゴリーを一つにまとめると、分析が見やすくなります。家族全員の記録が書き換わります。
      </p>
      <label className="field">
        <span className="field-label">まとめるカテゴリー</span>
        <select className="fk-input" required value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">選んでください</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">まとめた後のカテゴリー</span>
        <input
          className="fk-input"
          list="merge-to"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="今あるカテゴリーか、新しい名前"
        />
        <datalist id="merge-to">
          {categories
            .filter((c) => c !== from)
            .map((c) => (
              <option key={c} value={c} />
            ))}
        </datalist>
      </label>
      <button
        className="fk-button fk-button--primary fk-button--block form-submit"
        disabled={busy || !from || !to.trim()}
      >
        {busy ? "まとめています…" : "まとめる"}
      </button>
    </form>
  );
}
