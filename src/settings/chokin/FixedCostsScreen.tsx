// 固定費（家賃・通信費・サブスクなど毎月決まってかかるもの）。
// 登録すると、毎月はじめにアプリを開いたとき支払日の支出として自動で記録される。
// 追加は右下の主ボタン、直す・消すは行を押して開くシートで（消すは一番下、確認を挟む）。
import { useState, type FormEvent } from "react";
import { useCategories, useFixedCosts } from "../../data/hooks";
import type { FixedCost, FixedCostInput } from "../../data/types";
import { formatYen } from "../../lib/analytics";
import { EmptyState } from "../../ui/EmptyState";
import { Fab } from "../../ui/Fab";
import { useFeedback } from "../../ui/Feedback";
import { Icon } from "../../ui/Icon";
import { ActionRow, ControlRow, Section, Switch } from "../../ui/List";
import { Sheet } from "../../ui/Sheet";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const dayLabel = (d: number) => (d === 31 ? "月末" : `${d}日`);

function FixedCostSheet({ target, onClose }: { target: FixedCost | "new"; onClose: () => void }) {
  const { add, change, remove } = useFixedCosts();
  const categories = useCategories();
  const { toast, confirm } = useFeedback();
  const isNew = target === "new";
  const [form, setForm] = useState<FixedCostInput>(
    isNew ? { name: "", category: "", amount: 0, dayOfMonth: 1 } : { ...target },
  );
  // 新規：今月分から記録するか。変更：記録済みの今月分にも反映するか
  const [thisMonth, setThisMonth] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim() || !form.amount) return;
    setSaving(true);
    try {
      if (isNew) {
        await add(form, thisMonth);
        toast({
          message: thisMonth
            ? `「${form.name}」を登録し、今月分を記録しました`
            : `「${form.name}」を登録しました。来月から記録します`,
        });
      } else {
        await change(target, form, thisMonth);
        toast({ message: `「${form.name}」を保存しました` });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (isNew) return;
    const ok = await confirm({
      title: `「${target.name}」を削除しますか？`,
      message: "来月からは記録されなくなります。これまでに記録した支出は履歴に残ります。",
      confirmLabel: "削除する",
      danger: true,
    });
    if (!ok) return;
    await remove(target.id);
    onClose();
    toast({ message: `「${target.name}」を削除しました` });
  };

  return (
    <Sheet open title={isNew ? "固定費を追加" : "固定費を直す"} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span className="field-label">名前</span>
          <input
            className="fk-input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="家賃、スマホ代など"
          />
        </label>
        <label className="field">
          <span className="field-label">金額（円）</span>
          <input
            className="fk-input field-amount"
            type="number"
            inputMode="numeric"
            min="0"
            required
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span className="field-label">カテゴリー</span>
          <input
            className="fk-input"
            list="fixed-categories"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="住居費、通信費など"
          />
          <datalist id="fixed-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span className="field-label">支払日</span>
          <select
            className="fk-input"
            value={form.dayOfMonth}
            onChange={(e) => setForm({ ...form, dayOfMonth: Number(e.target.value) })}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d)}
              </option>
            ))}
          </select>
        </label>
        <Section>
          <ControlRow
            label={isNew ? "今月分から記録する" : "記録済みの今月分も直す"}
            description={isNew ? "外すと来月から記録します" : "今月の金額だけ違うときは外してください"}
          >
            <Switch
              label={isNew ? "今月分から記録する" : "記録済みの今月分も直す"}
              checked={thisMonth}
              onChange={setThisMonth}
            />
          </ControlRow>
        </Section>
        <button className="fk-button fk-button--primary fk-button--block form-submit" disabled={saving}>
          {saving ? "保存しています…" : isNew ? "登録する" : "保存する"}
        </button>
      </form>
      {!isNew && (
        <Section>
          <ActionRow label="この固定費を削除" danger onClick={del} />
        </Section>
      )}
    </Sheet>
  );
}

export function FixedCostsScreen() {
  const { fixedCosts, loading } = useFixedCosts();
  const [target, setTarget] = useState<FixedCost | "new" | null>(null);
  const total = fixedCosts.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="page">
      <p className="lead">
        毎月決まってかかるお金を登録すると、毎月はじめにアプリを開いたとき、支払日の支出として自動で記録します。電気代など金額が変わる月は、履歴からその月の分を直せます。
      </p>
      {loading ? null : fixedCosts.length === 0 ? (
        <EmptyState title="固定費はまだありません">
          右下の［追加］から、家賃やサブスクを登録できます。
        </EmptyState>
      ) : (
        <Section title={`毎月 ${formatYen(total)}`}>
          {fixedCosts.map((f) => (
            <button key={f.id} className="row row--link" onClick={() => setTarget(f)}>
              <span className="row-text">
                <span className="row-label">{f.name}</span>
                <span className="row-desc">
                  {f.category}・毎月{dayLabel(f.dayOfMonth)}
                </span>
              </span>
              <span className="row-value num">{formatYen(f.amount)}</span>
              <Icon name="forward" size="sm" className="row-trail" />
            </button>
          ))}
        </Section>
      )}
      <Fab label="追加" onClick={() => setTarget("new")} />
      {target && (
        <FixedCostSheet
          key={target === "new" ? "new" : target.id}
          target={target}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}
