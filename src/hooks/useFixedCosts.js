import { useCallback, useEffect, useState } from "react";
import { ref, onValue, push, update, remove, get } from "firebase/database";
import { database } from "../firebase/config";
import { addMonths, buildFixedExpense, fixedExpenseKey, toMonthKey } from "../utils/fixedCosts";

const normalize = (input) => ({
  name: input.name.trim(),
  category: input.category.trim(),
  amount: Number(input.amount) || 0,
  dayOfMonth: Math.min(Math.max(Number(input.dayOfMonth) || 1, 1), 31),
});

// 毎月かかる固定費のテンプレート一覧と、その追加・編集・削除
export const useFixedCosts = (familyId) => {
  const [fixedCosts, setFixedCosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setFixedCosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const fixedCostsRef = ref(database, `fixedCosts/${familyId}`);
    const unsubscribe = onValue(fixedCostsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data
        ? Object.keys(data)
            .map((id) => ({ id, ...data[id] }))
            .sort((a, b) => (a.dayOfMonth || 0) - (b.dayOfMonth || 0) || b.amount - a.amount)
        : [];
      setFixedCosts(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId]);

  // includeCurrentMonth=false の場合は来月分から計上する
  const addFixedCost = useCallback(
    async (input, { userId, includeCurrentMonth = true } = {}) => {
      if (!familyId) return;
      const currentMonth = toMonthKey(new Date());
      await push(ref(database, `fixedCosts/${familyId}`), {
        ...normalize(input),
        createdBy: userId || null,
        createdAt: new Date().toISOString(),
        // 同期処理は lastGeneratedMonth の翌月から計上する
        lastGeneratedMonth: includeCurrentMonth ? addMonths(currentMonth, -1) : currentMonth,
      });
    },
    [familyId]
  );

  // applyToCurrentMonth=true の場合、計上済みの今月分の支出にも変更を反映する
  const updateFixedCost = useCallback(
    async (fixedCost, input, { userId, applyToCurrentMonth = false } = {}) => {
      if (!familyId) return;
      const values = normalize(input);
      const updates = {};
      Object.entries(values).forEach(([key, value]) => {
        updates[`fixedCosts/${familyId}/${fixedCost.id}/${key}`] = value;
      });

      if (applyToCurrentMonth) {
        const currentMonth = toMonthKey(new Date());
        const expensePath = `expenses/${familyId}/${fixedExpenseKey(fixedCost.id, currentMonth)}`;
        // 削除済みの支出を復活させないよう、存在する場合だけ更新する
        const snapshot = await get(ref(database, expensePath));
        if (snapshot.exists()) {
          const { amount, category, description, date } = buildFixedExpense(
            { ...fixedCost, ...values },
            currentMonth,
            userId
          );
          Object.assign(updates, {
            [`${expensePath}/amount`]: amount,
            [`${expensePath}/category`]: category,
            [`${expensePath}/description`]: description,
            [`${expensePath}/date`]: date,
          });
        }
      }

      await update(ref(database), updates);
    },
    [familyId]
  );

  // テンプレートのみ削除する。計上済みの過去の支出は履歴として残す
  const removeFixedCost = useCallback(
    async (fixedCostId) => {
      if (!familyId) return;
      await remove(ref(database, `fixedCosts/${familyId}/${fixedCostId}`));
    },
    [familyId]
  );

  return { fixedCosts, loading, addFixedCost, updateFixedCost, removeFixedCost };
};
