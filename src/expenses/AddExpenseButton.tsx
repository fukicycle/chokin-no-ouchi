// 右下の主ボタン［記録する］。いちばん多い「今すぐ残したい」操作なので、どのタブでも同じ位置に置く。
import { useState } from "react";
import { Fab } from "../ui/Fab";
import { AddExpenseSheet } from "./AddExpenseSheet";

export function AddExpenseButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Fab label="記録する" onClick={() => setOpen(true)} />
      <AddExpenseSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
