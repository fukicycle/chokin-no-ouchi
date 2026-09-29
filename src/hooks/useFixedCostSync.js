import { useEffect, useRef, useState } from "react";
import { ref, update } from "firebase/database";
import { database } from "../firebase/config";
import { useFixedCosts } from "./useFixedCosts";
import { buildFixedExpense, fixedExpenseKey, pendingMonths, toMonthKey } from "../utils/fixedCosts";

// 固定費を各月の支出として自動計上する。
// アプリを開いた時と、PWAがバックグラウンドから復帰した時(月をまたいだ場合)に実行する。
export const useFixedCostSync = (familyId, userId) => {
  const { fixedCosts, loading } = useFixedCosts(familyId);
  const [monthKey, setMonthKey] = useState(() => toMonthKey(new Date()));
  const syncingRef = useRef(false);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") setMonthKey(toMonthKey(new Date()));
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!familyId || loading || syncingRef.current) return;

    const updates = {};
    fixedCosts.forEach((fixedCost) => {
      const months = pendingMonths(fixedCost.lastGeneratedMonth, monthKey);
      if (months.length === 0) return;

      months.forEach((m) => {
        updates[`expenses/${familyId}/${fixedExpenseKey(fixedCost.id, m)}`] = buildFixedExpense(
          fixedCost,
          m,
          userId
        );
      });
      // 計上済みの月を記録しておくと、ユーザーが削除した月の支出を再計上しない
      updates[`fixedCosts/${familyId}/${fixedCost.id}/lastGeneratedMonth`] = monthKey;
    });

    if (Object.keys(updates).length === 0) return;

    syncingRef.current = true;
    update(ref(database), updates)
      .catch((error) => console.error("固定費の自動計上に失敗しました:", error))
      .finally(() => {
        syncingRef.current = false;
      });
  }, [familyId, userId, fixedCosts, loading, monthKey]);
};
