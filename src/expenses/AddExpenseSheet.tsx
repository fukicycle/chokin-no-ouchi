// 支出を記録するシート（右下の［記録する］から開く）。手入力とレシートを上で切り替える。
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { addExpense } from "../data/expenses";
import { useFeedback } from "../ui/Feedback";
import { Choice } from "../ui/List";
import { Sheet } from "../ui/Sheet";
import { ExpenseForm } from "./ExpenseForm";
import { ReceiptReader } from "./ReceiptReader";

export function AddExpenseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { familyId, user } = useAuth();
  const { toast } = useFeedback();
  const [mode, setMode] = useState<"manual" | "receipt">("manual");

  return (
    <Sheet open={open} title="支出を記録" onClose={onClose}>
      <div className="sheet-switch">
        <Choice
          label="記録のしかた"
          value={mode}
          options={[
            { value: "manual", label: "手入力" },
            { value: "receipt", label: "レシート" },
          ]}
          onChange={setMode}
        />
      </div>
      {mode === "manual" ? (
        <ExpenseForm
          submitLabel="記録する"
          onSubmit={async (input) => {
            if (!familyId) return;
            await addExpense(familyId, { ...input, userId: user?.uid ?? null });
            onClose();
            toast({ message: `${input.category} ¥${input.amount.toLocaleString()} を記録しました` });
          }}
        />
      ) : (
        <ReceiptReader
          onSaved={(n) => {
            onClose();
            toast({ message: `${n}件を記録しました` });
          }}
        />
      )}
    </Sheet>
  );
}
