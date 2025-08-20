import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, startAt, endAt } from 'firebase/database';
import { database } from '../firebase/config';

export const useRecentExpenses = (familyId, numberOfMonths) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = new Date();
    const dataListeners = [];
    const monthlyData = {};

    for (let i = 0; i < numberOfMonths; i++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

      const expensesRef = ref(database, `expenses/${familyId}`);
      const expensesQuery = query(
        expensesRef,
        orderByChild('date'),
        startAt(startDate),
        endAt(endDate)
      );

      const listener = onValue(expensesQuery, (snapshot) => {
        const expenses = snapshot.val() || {};
        const totalAmount = Object.values(expenses).reduce((sum, expense) => sum + expense.amount, 0);
        monthlyData[`${year}-${month}`] = totalAmount;

        const sortedData = Object.keys(monthlyData)
          .sort()
          .map(key => ({
            month: key,
            total: monthlyData[key],
          }));
        
        setData(sortedData);
        setLoading(false);
      });
      dataListeners.push(listener);
    }
    
    return () => {
      dataListeners.forEach(unsubscribe => unsubscribe());
    };
  }, [familyId, numberOfMonths]);

  return { data, loading };
};