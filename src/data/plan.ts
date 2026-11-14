// 貯金の計画（家族で共有）。budgets/{familyId} に置く。
//   monthlyBudget …… 使えるお金（手取り − 貯めたい額）。前の版（v2）もこの値を読むので、いつもそろえておく
//   plans/{YYYY-MM} … その月から有効な計画 { income, goal }（計算は src/lib/savings.ts）
import { onValue, ref, update } from "firebase/database";
import { useCallback } from "react";
import { useAuth } from "../auth/AuthProvider";
import { database } from "../firebase/config";
import { toMonthKey } from "../lib/months";
import { budgetOf, type Plan, type Plans } from "../lib/savings";
import { useLive } from "./useLive";

type BudgetDoc = { plans: Plans; legacyBudget: number };
const EMPTY: BudgetDoc = { plans: {}, legacyBudget: 0 };

const toPlans = (raw: unknown): Plans => {
  const plans: Plans = {};
  for (const [month, v] of Object.entries((raw ?? {}) as Record<string, Partial<Plan>>)) {
    if (/^\d{4}-\d{2}$/.test(month) && v && Number(v.income) > 0) {
      plans[month] = { income: Number(v.income) || 0, goal: Number(v.goal) || 0 };
    }
  }
  return plans;
};

export function usePlans() {
  const { familyId } = useAuth();
  const { value, loading } = useLive<BudgetDoc>(
    familyId ? `plans|${familyId}` : null,
    (set) =>
      onValue(ref(database, `budgets/${familyId}`), (s) =>
        set({ plans: toPlans(s.val()?.plans), legacyBudget: Number(s.val()?.monthlyBudget) || 0 }),
      ),
    EMPTY,
  );

  /** 今月から有効な計画として保存する（先月までの結果は変わらない） */
  const savePlan = useCallback(
    async (plan: Plan) => {
      if (!familyId) return;
      await update(ref(database, `budgets/${familyId}`), {
        [`plans/${toMonthKey(new Date())}`]: plan,
        monthlyBudget: budgetOf(plan),
      });
    },
    [familyId],
  );

  return { plans: value.plans, legacyBudget: value.legacyBudget, loading, savePlan };
}
