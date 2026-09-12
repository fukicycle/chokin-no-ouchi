import { useEffect, useState, useCallback } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "../firebase/config";

export const useBudget = (familyId) => {
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setMonthlyBudget(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const budgetRef = ref(database, `budgets/${familyId}`);
    const unsubscribe = onValue(budgetRef, (snapshot) => {
      const data = snapshot.val();
      setMonthlyBudget(data?.monthlyBudget || 0);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId]);

  const saveBudget = useCallback(
    async (amount) => {
      if (!familyId) return;
      const budgetRef = ref(database, `budgets/${familyId}`);
      await update(budgetRef, { monthlyBudget: Number(amount) || 0 });
    },
    [familyId]
  );

  return { monthlyBudget, loading, saveBudget };
};
