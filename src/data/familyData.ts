// 設定 ＞ データ（書き出し・読み込み・全削除）と、カテゴリーの統合。対象はログイン中の家族のデータ。
import { get, ref, set, update } from "firebase/database";
import { useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";
import type { DataHandlers } from "../config/types";
import { database } from "../firebase/config";

type FamilyData = {
  expenses?: Record<string, unknown>;
  fixedCosts?: Record<string, unknown>;
  budget?: Record<string, unknown>;
};

const paths = (familyId: string) => ({
  expenses: `expenses/${familyId}`,
  fixedCosts: `fixedCosts/${familyId}`,
  budget: `budgets/${familyId}`,
});

export function useDataHandlers(): DataHandlers | null {
  const { familyId } = useAuth();
  return useMemo(() => {
    if (!familyId) return null;
    const p = paths(familyId);
    return {
      export: async () => {
        const [expenses, fixedCosts, budget] = await Promise.all(
          [p.expenses, p.fixedCosts, p.budget].map((path) => get(ref(database, path))),
        );
        return {
          expenses: expenses.val() ?? {},
          fixedCosts: fixedCosts.val() ?? {},
          budget: budget.val() ?? {},
        };
      },
      import: async (raw) => {
        const data = raw as FamilyData;
        if (!data || typeof data !== "object" || typeof data.expenses !== "object") {
          throw new Error("貯金のおうちで書き出したファイルではありません");
        }
        await update(ref(database), {
          [p.expenses]: data.expenses ?? null,
          [p.fixedCosts]: data.fixedCosts ?? null,
          [p.budget]: data.budget ?? null,
        });
      },
      clear: async () => {
        await update(ref(database), { [p.expenses]: null, [p.fixedCosts]: null, [p.budget]: null });
      },
    };
  }, [familyId]);
}

/**
 * カテゴリーの統合。from の支出をすべて to に書き換える。
 * 固定費のひな形も揃え、来月以降の自動計上で元のカテゴリーが戻らないようにする。戻り値は書き換えた支出の件数
 */
export async function mergeCategory(familyId: string, from: string, to: string) {
  const [expenses, fixedCosts] = await Promise.all([
    get(ref(database, `expenses/${familyId}`)),
    get(ref(database, `fixedCosts/${familyId}`)),
  ]);
  const updates: Record<string, string> = {};
  let count = 0;
  for (const [id, e] of Object.entries((expenses.val() ?? {}) as Record<string, { category: string }>)) {
    if (e.category === from) {
      updates[`expenses/${familyId}/${id}/category`] = to;
      count += 1;
    }
  }
  for (const [id, f] of Object.entries((fixedCosts.val() ?? {}) as Record<string, { category: string }>)) {
    if (f.category === from) updates[`fixedCosts/${familyId}/${id}/category`] = to;
  }
  if (Object.keys(updates).length > 0) await update(ref(database), updates);
  return count;
}

/** 入力忘れリマインダーの購読（scripts/send-reminders.cjs が毎晩読む） */
export const savePushSubscription = (uid: string, subscription: PushSubscriptionJSON | null) =>
  set(ref(database, `users/${uid}/pushSubscription`), subscription);
