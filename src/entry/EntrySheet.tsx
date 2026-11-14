// 支出を記録する・直すシート。
//
// 置き場所と動機（買い物の直後に、片手で、数秒で終わらせたい）
// - 金額は自前のテンキーで打つ。端末のキーボードを出さないので、開いた瞬間から打てて、
//   キーボードがせり上がって画面が動くこともない。キーは親指の届くシートの下半分に置く
// - カテゴリーはよく使う順に並べて、押すだけ。新しい名前を足すときだけ文字を打つ
// - 使った日は「今日」が最初から入っている。別の日にしたいときだけ押す。メモは打たなくてよい
// - ［記録する］はいちばん下（テンキーのすぐ下）。金額とカテゴリーがそろうまで押せない
// - 特別費（車検・結婚式など）は、日付の隣の切り替え。めったに使わないので小さく、ただし打ち終える前に目に入る所。
//   入れるとメモの欄の例が変わり、何のための印かが分かる
// - レシートを撮る人は最初にそう決めているので、カメラは金額の左（打ち始める前に目に入る所）
// - 削除はいちばん下に離して置き、確認を挟む。消したあとも［元に戻す］で戻せる
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import {
  addExpense,
  dateInputToIso,
  isoToDateInput,
  removeExpense,
  restoreExpense,
  todayInput,
  updateExpense,
} from "../data/expenses";
import { useCategories } from "../data/hooks";
import type { Expense } from "../data/types";
import { formatDay, formatYen } from "../lib/format";
import { useFeedback } from "../ui/Feedback";
import { Icon } from "../ui/Icon";
import { Sheet } from "../ui/Sheet";
import { Keypad, pressKey } from "./Keypad";
import { ReceiptReader } from "./ReceiptReader";

// まだ記録が少ないうちに並べておく候補
const STARTER_CATEGORIES = ["食費", "日用品", "外食", "交通", "趣味・娯楽", "医療", "その他"];

type Props = { open: boolean; expense: Expense | null; onClose: () => void };

export function EntrySheet({ open, expense, onClose }: Props) {
  const [mode, setMode] = useState<"keys" | "receipt">("keys");
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const title = expense ? "記録を直す" : mode === "receipt" ? "レシートを読む" : "記録する";
  return (
    <Sheet open={open} title={title} onClose={onClose}>
      {mode === "receipt" ? (
        <ReceiptReader
          onBack={() => setMode("keys")}
          onSetup={() => {
            onClose();
            navigate("/settings/receipt");
          }}
          onSaved={(n) => {
            onClose();
            toast({ message: `${n}件を記録しました` });
          }}
        />
      ) : (
        <EntryForm expense={expense} active={open} onClose={onClose} onReceipt={() => setMode("receipt")} />
      )}
    </Sheet>
  );
}

function EntryForm({
  expense,
  active,
  onClose,
  onReceipt,
}: {
  expense: Expense | null;
  active: boolean;
  onClose: () => void;
  onReceipt: () => void;
}) {
  const { familyId, user } = useAuth();
  const { toast, confirm } = useFeedback();
  const used = useCategories();
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [category, setCategory] = useState(expense?.category ?? "");
  const [date, setDate] = useState(expense ? isoToDateInput(expense.date) : todayInput());
  const [memo, setMemo] = useState(expense?.description ?? "");
  const [naming, setNaming] = useState(false);
  const [special, setSpecial] = useState(Boolean(expense?.isSpecial));

  // よく使う順。足りない分は最初の候補で埋める。選んでいるものは必ず並べる
  const categories = [...used, ...STARTER_CATEGORIES.filter((c) => !used.includes(c))];
  if (category && !naming && !categories.includes(category)) categories.unshift(category);

  const value = Number(amount) || 0;
  const ready = value > 0 && category.trim() !== "";

  const save = () => {
    if (!familyId || !ready) return;
    const input = {
      amount: value,
      category: category.trim(),
      description: memo.trim(),
      date: dateInputToIso(date),
    };
    if (expense) {
      // null を書くと、その印は消える
      void updateExpense(familyId, expense.id, { ...input, isSpecial: special ? true : null });
      onClose();
      toast({
        message: "直しました",
        actionLabel: "元に戻す",
        onAction: () => restoreExpense(familyId, expense),
      });
    } else {
      // 書き込みを待たずに閉じる（電波の弱い所でも待たせない。届いたら一覧と数字に入る）
      const created = addExpense(familyId, {
        ...input,
        userId: user?.uid ?? null,
        ...(special ? { isSpecial: true } : {}),
      });
      onClose();
      toast({
        message: `${input.category} ${formatYen(value)} を${special ? "特別費として" : ""}記録しました`,
        actionLabel: "元に戻す",
        onAction: () => created.key && removeExpense(familyId, created.key),
      });
    }
  };

  const del = async () => {
    if (!familyId || !expense) return;
    const ok = await confirm({
      title: "この記録を削除しますか？",
      message: `${expense.category} ${formatYen(expense.amount)}（${formatDay(isoToDateInput(expense.date))}）`,
      confirmLabel: "削除する",
      danger: true,
    });
    if (!ok) return;
    void removeExpense(familyId, expense.id);
    onClose();
    toast({
      message: "削除しました",
      actionLabel: "元に戻す",
      onAction: () => restoreExpense(familyId, expense),
    });
  };

  // パソコンでは数字キーでも打てる（文字の欄に入っているときは除く）
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^\d$/.test(e.key)) setAmount((a) => pressKey(a, e.key));
      else if (e.key === "Backspace") setAmount((a) => pressKey(a, "back"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <div className="entry">
      <div className="entry-top">
        {!expense && (
          <button className="fk-icon-button" aria-label="レシートを読む" onClick={onReceipt}>
            <Icon name="camera" />
          </button>
        )}
        <output className={value > 0 ? "entry-amount" : "entry-amount is-empty"} aria-label="金額">
          {formatYen(value)}
        </output>
      </div>

      {naming ? (
        <div className="entry-naming">
          <input
            className="fk-input"
            autoFocus
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="新しいカテゴリーの名前"
            aria-label="新しいカテゴリーの名前"
            enterKeyHint="done"
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
          <button
            className="fk-icon-button fk-icon-button--flat"
            aria-label="一覧から選ぶ"
            onClick={() => {
              setNaming(false);
              setCategory("");
            }}
          >
            <Icon name="close" />
          </button>
        </div>
      ) : (
        <div className="chips chips--scroll fk-scroll" role="group" aria-label="カテゴリー">
          {categories.map((c) => (
            <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
          <button
            className="chip chip--add"
            aria-label="新しいカテゴリー"
            onClick={() => {
              setNaming(true);
              setCategory("");
            }}
          >
            <Icon name="add" size="sm" />
          </button>
        </div>
      )}

      <div className="entry-meta">
        <label className="entry-date">
          <Icon name="calendar" size="sm" />
          <span>{formatDay(date)}</span>
          <input
            type="date"
            aria-label="使った日"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </label>
        <button
          className="chip entry-special"
          aria-pressed={special}
          title="車検・結婚式など、ふだんの暮らしの外の出費。使えるお金には数えません"
          onClick={() => setSpecial(!special)}
        >
          特別費
        </button>
        <input
          className="fk-input entry-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={special ? "車検・結婚式など" : "メモ"}
          aria-label="メモ"
          enterKeyHint="done"
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </div>

      <Keypad onPress={(k) => setAmount((a) => pressKey(a, k))} />

      <button className="fk-button fk-button--primary fk-button--block" disabled={!ready} onClick={save}>
        {expense ? "保存する" : "記録する"}
      </button>

      {expense && (
        <button className="entry-delete" onClick={del}>
          <Icon name="delete" size="sm" />
          この記録を削除する
        </button>
      )}
    </div>
  );
}
