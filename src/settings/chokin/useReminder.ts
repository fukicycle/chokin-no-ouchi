// 入力忘れのお知らせ（Web Push）。購読は users/{uid}/pushSubscription に保存し、
// scripts/send-reminders.cjs（GitHub Actions、毎晩）が読んで送る。
import { onValue, ref } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { savePushSubscription } from "../../data/familyData";
import { database } from "../../firebase/config";
import { useFeedback } from "../../ui/Feedback";

// 送る側（VAPID）の公開鍵。秘密鍵は GitHub の Secrets にだけある
const VAPID_PUBLIC_KEY =
  "BBIgzrCk48RRt-Ysq1lllDEh_yd20_s9bm5ayoFi0clf-fcuhC3iDCEvUO2D_DgZequD6YavrylDkxWfDKo0c9w";

const toUint8 = (base64: string) => {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

export function useReminder() {
  const { user } = useAuth();
  const { toast } = useFeedback();
  const [on, setOn] = useState(false);
  const supported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  useEffect(() => {
    if (!user) return;
    return onValue(ref(database, `users/${user.uid}/pushSubscription`), (s) => setOn(s.exists()));
  }, [user]);

  const set = useCallback(
    async (next: boolean) => {
      if (!user) return;
      try {
        const registration = await navigator.serviceWorker.ready;
        if (!next) {
          await (await registration.pushManager.getSubscription())?.unsubscribe();
          await savePushSubscription(user.uid, null);
          toast({ message: "入力忘れのお知らせを止めました" });
          return;
        }
        if ((await Notification.requestPermission()) !== "granted") {
          toast({ message: "通知が許可されていません。端末の設定でこのアプリの通知を許可してください。" });
          return;
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toUint8(VAPID_PUBLIC_KEY),
        });
        await savePushSubscription(user.uid, subscription.toJSON());
        toast({ message: "記録がない日は、夜にお知らせします" });
      } catch {
        toast({ message: "切り替えられませんでした。iPhone はホーム画面に追加してから開いてください。" });
      }
    },
    [user, toast],
  );

  return { on, set, supported };
}
