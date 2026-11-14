// 今日の日付。アプリを開いたまま日付が変わっても、前に出てきたときに追いつく。
import { useEffect, useState } from "react";
import { dayKey } from "./format";

export function useToday() {
  const [key, setKey] = useState(() => dayKey(new Date()));
  useEffect(() => {
    const check = () => document.visibilityState === "visible" && setKey(dayKey(new Date()));
    document.addEventListener("visibilitychange", check);
    const timer = setInterval(check, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", check);
      clearInterval(timer);
    };
  }, []);
  return key;
}

/** "YYYY-MM-DD" を、その日の正午の Date にする */
export const dayKeyToDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
