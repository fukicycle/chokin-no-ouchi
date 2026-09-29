import { useEffect, useState } from "react";
import { ref, onValue, query, orderByChild, startAt, endAt } from "firebase/database";
import { database } from "../firebase/config";

// 任意の期間 [start, end] の支出を購読する。start/end は Date
export const useExpensesInRange = (familyId, start, end) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date オブジェクトは毎レンダー作り直されるので、依存には ISO 文字列を使う
  const startIso = start ? start.toISOString() : null;
  const endIso = end ? end.toISOString() : null;

  useEffect(() => {
    if (!familyId || !startIso || !endIso) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const expensesQuery = query(
      ref(database, `expenses/${familyId}`),
      orderByChild("date"),
      startAt(startIso),
      endAt(endIso)
    );

    const unsubscribe = onValue(expensesQuery, (snapshot) => {
      const data = snapshot.val();
      setExpenses(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId, startIso, endIso]);

  return { expenses, loading };
};
