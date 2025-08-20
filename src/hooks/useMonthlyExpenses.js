import { useEffect, useState } from "react";
import {
  ref,
  onValue,
  query,
  orderByChild,
  startAt,
  endAt,
} from "firebase/database";
import { database } from "../firebase/config";

export const useMonthlyExpenses = (familyId, year, month) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || !year || !month) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const expensesRef = ref(database, `expenses/${familyId}`);
    const expensesQuery = query(
      expensesRef,
      orderByChild("date"),
      startAt(startDate),
      endAt(endDate)
    );

    const unsubscribe = onValue(expensesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const expenseList = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .reverse();
        setExpenses(expenseList);
      } else {
        setExpenses([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId, year, month]);

  return { expenses, loading };
};
