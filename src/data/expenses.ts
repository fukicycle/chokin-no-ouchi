// 支出の書き込み
import { push, ref, remove, set, update } from "firebase/database";
import { database } from "../firebase/config";
import type { Expense, ExpenseInput } from "./types";

/** <input type="date"> の "YYYY-MM-DD" を、その日の正午の ISO 文字列にする（月の境でずれないように） */
export const dateInputToIso = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toISOString();
};

/** ISO 文字列を <input type="date"> の値にする（端末の日付で） */
export const isoToDateInput = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const todayInput = () => isoToDateInput(new Date().toISOString());

export const addExpense = (familyId: string, input: ExpenseInput) =>
  push(ref(database, `expenses/${familyId}`), input);

export const updateExpense = (familyId: string, id: string, patch: Partial<ExpenseInput>) =>
  update(ref(database, `expenses/${familyId}/${id}`), patch);

export const removeExpense = (familyId: string, id: string) =>
  remove(ref(database, `expenses/${familyId}/${id}`));

/** 「元に戻す」：消した支出を同じキーで戻す */
export const restoreExpense = (familyId: string, expense: Expense) => {
  const { id, ...rest } = expense;
  return set(ref(database, `expenses/${familyId}/${id}`), rest);
};
