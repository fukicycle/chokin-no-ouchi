// 日ごとのメモ（家族で共有）。旅行・帰省・お祝いなど、「なぜこの日は多かったか」を後から振り返るため。
// budgets/{familyId}/notes/{YYYY-MM-DD} = { text, userId, updatedAt }
// budgets/{familyId} の下に置くので、データベースのルール（database.rules.json）は変えずに読み書きできる。
// 書き出し・読み込み・全削除も budgets ごと扱うので、そのまま含まれる。
import { endAt, onValue, orderByKey, query, ref, remove, set, startAt } from "firebase/database";
import { useAuth } from "../auth/AuthProvider";
import { database } from "../firebase/config";
import type { MonthKey } from "../lib/months";
import { useLive } from "./useLive";

export type DayNote = { text: string; userId?: string | null; updatedAt?: string };
export type DayNotes = Record<string, DayNote>;

const EMPTY: DayNotes = {};

/** その月の日ごとのメモ（キーは "YYYY-MM-DD"） */
export function useDayNotes(month: MonthKey) {
  const { familyId } = useAuth();
  return useLive<DayNotes>(
    familyId ? `notes|${familyId}|${month}` : null,
    (set) =>
      onValue(
        query(
          ref(database, `budgets/${familyId}/notes`),
          orderByKey(),
          startAt(`${month}-01`),
          endAt(`${month}-31`),
        ),
        (s) => {
          const notes: DayNotes = {};
          for (const [key, v] of Object.entries((s.val() ?? {}) as Record<string, Partial<DayNote>>)) {
            if (v && typeof v.text === "string" && v.text.trim()) notes[key] = v as DayNote;
          }
          set(notes);
        },
      ),
    EMPTY,
    { keepPrevious: true },
  );
}

/** メモを残す。空なら消す */
export const saveDayNote = (familyId: string, key: string, text: string, userId: string | null) => {
  const path = ref(database, `budgets/${familyId}/notes/${key}`);
  const trimmed = text.trim();
  return trimmed ? set(path, { text: trimmed, userId, updatedAt: new Date().toISOString() }) : remove(path);
};

/** 「元に戻す」：前のメモ（無かったなら消す）に戻す */
export const restoreDayNote = (familyId: string, key: string, note: DayNote | undefined) =>
  note
    ? set(ref(database, `budgets/${familyId}/notes/${key}`), note)
    : remove(ref(database, `budgets/${familyId}/notes/${key}`));
