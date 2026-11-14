// レシートの読み取り。撮る（カメラ）と選ぶ（写真）を並べ、何枚でもまとめて読める。
// 読み取った内容は確かめてから保存する（間違いを直せるように、欄はそのまま編集できる）。
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { addExpense } from "../data/expenses";
import { useCategories } from "../data/hooks";
import { readReceipt, waitBetweenRequests } from "../receipt/gemini";
import { useGeminiSettings } from "../receipt/useGeminiSettings";
import { Icon } from "../ui/Icon";
import { draftToInput, ReceiptFields, type ExpenseDraft } from "./ReceiptFields";
import { todayInput } from "../data/expenses";

type Item = {
  id: string;
  preview: string;
  file: File;
  status: "waiting" | "reading" | "done" | "error";
  note?: string;
  error?: string;
  draft?: ExpenseDraft;
};

let seq = 0;

export function ReceiptReader({
  onSaved,
  onBack,
  onSetup,
}: {
  onSaved: (count: number) => void;
  /** 手で入れるほうへ戻る */
  onBack: () => void;
  /** API キーの登録へ進む */
  onSetup: () => void;
}) {
  const { familyId, user } = useAuth();
  const { apiKey, model } = useGeminiSettings();
  const categories = useCategories();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const patch = (id: string, p: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...p } : i)));

  // 無料枠のレート制限に当たらないよう、1枚ずつ間を空けて読む
  const run = async (queue: Item[]) => {
    setBusy(true);
    for (const [n, item] of queue.entries()) {
      patch(item.id, { status: "reading", error: undefined, note: undefined });
      try {
        const { data } = await readReceipt(apiKey, item.file, {
          categories,
          model,
          onStatus: (s) => {
            if (s.type === "fallback")
              patch(item.id, { note: "混み合っているので、別のモデルで読み取っています" });
            if (s.type === "rateLimited")
              patch(item.id, { note: `混み合っています。${s.waitSeconds}秒後にもう一度試します` });
          },
        });
        patch(item.id, {
          status: "done",
          note: undefined,
          draft: {
            amount: data.amount ? String(data.amount) : "",
            category: data.category || "",
            description: [data.storeName, ...(data.items ?? []).map((i) => i.name)]
              .filter(Boolean)
              .join(" / "),
            date: /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : todayInput(),
          },
        });
      } catch (e) {
        patch(item.id, {
          status: "error",
          note: undefined,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      if (n < queue.length - 1) await waitBetweenRequests();
    }
    setBusy(false);
  };

  const pick = (files: FileList | null) => {
    const list = [...(files ?? [])].map<Item>((file) => ({
      id: `r${++seq}`,
      file,
      preview: URL.createObjectURL(file),
      status: "waiting",
    }));
    if (list.length === 0) return;
    setItems((cur) => [...cur, ...list]);
    run(list);
  };

  const ready = items.filter((i) => i.status === "done" && i.draft?.amount && i.draft.category.trim());

  const saveAll = async () => {
    if (!familyId) return;
    setSaving(true);
    try {
      for (const i of ready)
        await addExpense(familyId, { ...draftToInput(i.draft!), userId: user?.uid ?? null });
      onSaved(ready.length);
    } finally {
      setSaving(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="receipt-setup">
        <p className="lead">
          レシートの読み取りには、Google の Gemini API
          キーが要ります。キーはこの端末にだけ保存され、家族とも共有されません。
        </p>
        <button className="fk-button fk-button--block" onClick={onSetup}>
          API キーを登録する
        </button>
        <button className="link-button" onClick={onBack}>
          手で入れる
        </button>
      </div>
    );
  }

  return (
    <div className="receipt">
      <div className="receipt-pick">
        <label className="fk-button">
          <Icon name="camera" />
          撮る
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => (pick(e.target.files), (e.target.value = ""))}
          />
        </label>
        <label className="fk-button">
          <Icon name="image" />
          写真から選ぶ
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => (pick(e.target.files), (e.target.value = ""))}
          />
        </label>
      </div>
      {items.length === 0 && (
        <>
          <p className="hint">何枚でもまとめて読み取れます。読み取った内容は保存する前に直せます。</p>
          <button className="link-button" onClick={onBack}>
            手で入れる
          </button>
        </>
      )}

      <ol className="receipt-list">
        {items.map((i) => (
          <li key={i.id} className="receipt-item">
            <div className="receipt-head">
              <img src={i.preview} alt="" className="receipt-thumb fk-down" />
              <div className="receipt-status">
                {i.status === "waiting" && <span className="muted">順番を待っています</span>}
                {i.status === "reading" && <span>読み取っています…</span>}
                {i.status === "done" && (
                  <span className="status-ok">
                    <Icon name="check" size="sm" /> 読み取りました。内容を確かめてください
                  </span>
                )}
                {i.status === "error" && (
                  <span className="status-error">
                    <Icon name="error" size="sm" /> {i.error}
                  </span>
                )}
                {i.note && <span className="muted">{i.note}</span>}
              </div>
              <div className="receipt-actions">
                {i.status === "error" && !busy && (
                  <button className="link-button" onClick={() => run([i])}>
                    もう一度
                  </button>
                )}
                <button
                  className="fk-icon-button fk-icon-button--flat"
                  aria-label="この写真を外す"
                  onClick={() => setItems((l) => l.filter((x) => x.id !== i.id))}
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>
            </div>
            {i.status === "done" && i.draft && (
              <ReceiptFields draft={i.draft} onChange={(d) => patch(i.id, { draft: d })} idPrefix={i.id} />
            )}
          </li>
        ))}
      </ol>

      {ready.length > 0 && (
        <button
          className="fk-button fk-button--primary fk-button--block form-submit"
          disabled={saving || busy}
          onClick={saveAll}
        >
          {saving ? "保存しています…" : `${ready.length}件を記録する`}
        </button>
      )}
    </div>
  );
}
