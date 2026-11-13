// 支出の詳細。直すときは［編集］、消すときは一番下の［削除］（主ボタンから離し、確認を挟む）。
// 消したあとはトーストの［元に戻す］で戻せる。
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { removeExpense, restoreExpense, updateExpense } from "../data/expenses";
import type { Expense } from "../data/types";
import { formatYen } from "../lib/analytics";
import { useFeedback } from "../ui/Feedback";
import { Icon } from "../ui/Icon";
import { ActionRow, InfoRow, Section } from "../ui/List";
import { Sheet } from "../ui/Sheet";
import { ExpenseForm } from "./ExpenseForm";

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

export function ExpenseDetailSheet({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const { familyId } = useAuth();
  const { confirm, toast } = useFeedback();
  const [editing, setEditing] = useState(false);
  const close = () => {
    setEditing(false);
    onClose();
  };
  if (!expense) return null;

  const del = async () => {
    if (!familyId) return;
    const ok = await confirm({
      title: "この支出を削除しますか？",
      message: `${expense.category} ${formatYen(expense.amount)}（${dateFmt.format(new Date(expense.date))}）`,
      confirmLabel: "削除する",
      danger: true,
    });
    if (!ok) return;
    await removeExpense(familyId, expense.id);
    close();
    toast({
      message: "削除しました",
      actionLabel: "元に戻す",
      onAction: () => restoreExpense(familyId, expense),
    });
  };

  return (
    <Sheet open title={editing ? "支出を直す" : "支出"} onClose={close}>
      {editing ? (
        <ExpenseForm
          initial={expense}
          submitLabel="保存する"
          onSubmit={async (input) => {
            if (!familyId) return;
            await updateExpense(familyId, expense.id, input);
            close();
            toast({ message: "保存しました" });
          }}
        />
      ) : (
        <>
          <div className="detail-hero">
            <span className="detail-amount">{formatYen(expense.amount)}</span>
            <button className="fk-icon-button" aria-label="編集" onClick={() => setEditing(true)}>
              <Icon name="edit" />
            </button>
          </div>
          <Section>
            <InfoRow label="カテゴリー" value={expense.category} />
            <InfoRow label="使った日" value={dateFmt.format(new Date(expense.date))} />
            {expense.description && <InfoRow label="メモ" value={expense.description} />}
            {expense.isFixed && <InfoRow label="記録のしかた" value="固定費から自動で記録" />}
          </Section>
          <Section>
            <ActionRow label="この支出を削除" danger onClick={del} />
          </Section>
        </>
      )}
    </Sheet>
  );
}
