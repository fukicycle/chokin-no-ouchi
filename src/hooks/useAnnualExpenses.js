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

export const useAnnualExpenses = (familyId, year) => {
  const [annualTotal, setAnnualTotal] = useState(0);
  const [annualExpenses, setAnnualExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || !year) {
      setAnnualTotal(0);
      setAnnualExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

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
        const list = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const total = list.reduce(
          (sum, expense) => sum + (expense.amount || 0),
          0
        );

        setAnnualExpenses(list);
        setAnnualTotal(total);
      } else {
        setAnnualExpenses([]);
        setAnnualTotal(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId, year]);

  return { annualExpenses, annualTotal, loading };
};
