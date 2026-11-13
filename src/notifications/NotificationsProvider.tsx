// 通知一覧と未読の管理。新しい版のお知らせもここに並ぶ。
// 未読があるときはトップバーの風鈴に朱の点が付く（数字は出さない）。
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { load, save } from "../lib/storage";
import { useUpdate } from "../update/UpdateProvider";

export type AppNotification = {
  id: string;
  title: string;
  body?: string[];
  createdAt: number;
  read: boolean;
};

export type NotificationItem =
  | ({ kind: "app" } & AppNotification)
  | { kind: "update"; id: string; version: string; date: string; notes: string[]; read: boolean };

type State = {
  items: NotificationItem[];
  hasUnread: boolean;
  /** アプリ固有のお知らせを足す（例：「同期が終わりました」） */
  push: (n: { title: string; body?: string[] }) => void;
  remove: (id: string) => void;
  /** アプリ固有のお知らせをすべて消す（新しい版のお知らせは更新するまで残る） */
  clearAppNotifications: () => void;
  /** 一覧を開いたときに呼ぶ。すべて既読にする */
  markAllRead: () => void;
};

const Ctx = createContext<State | null>(null);
const MAX = 50;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { latest } = useUpdate();
  const [appItems, setAppItems] = useState<AppNotification[]>(() => load("notifications", []));
  const [seenUpdate, setSeenUpdate] = useState<string | null>(() => load("seenUpdate", null));

  const persist = useCallback((next: AppNotification[]) => {
    setAppItems(next);
    save("notifications", next);
  }, []);

  const push = useCallback<State["push"]>(
    (n) =>
      persist(
        [{ id: crypto.randomUUID(), createdAt: Date.now(), read: false, ...n }, ...appItems].slice(0, MAX),
      ),
    [appItems, persist],
  );

  const remove = useCallback(
    (id: string) => persist(appItems.filter((n) => n.id !== id)),
    [appItems, persist],
  );
  const clearAppNotifications = useCallback(() => persist([]), [persist]);

  const markAllRead = useCallback(() => {
    if (appItems.some((n) => !n.read)) persist(appItems.map((n) => ({ ...n, read: true })));
    if (latest && seenUpdate !== latest.version) {
      setSeenUpdate(latest.version);
      save("seenUpdate", latest.version);
    }
  }, [appItems, latest, seenUpdate, persist]);

  const items = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = appItems.map((n) => ({ kind: "app" as const, ...n }));
    // 新しい版のお知らせは、更新するまで一番上に残す
    if (latest) {
      list.unshift({
        kind: "update",
        id: `update-${latest.version}`,
        version: latest.version,
        date: latest.date,
        notes: latest.notes,
        read: seenUpdate === latest.version,
      });
    }
    return list;
  }, [appItems, latest, seenUpdate]);

  const hasUnread = items.some((n) => !n.read);

  return (
    <Ctx.Provider value={{ items, hasUnread, push, remove, clearAppNotifications, markAllRead }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications は NotificationsProvider の中で使う");
  return ctx;
}
