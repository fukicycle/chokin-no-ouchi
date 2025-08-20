import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';

export const useCategories = (familyId) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const expensesRef = ref(database, `expenses/${familyId}`);
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const uniqueCategories = new Set();
        Object.values(data).forEach(expense => {
          uniqueCategories.add(expense.category);
        });
        setCategories(Array.from(uniqueCategories));
      } else {
        setCategories([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId]);

  return { categories, loading };
};