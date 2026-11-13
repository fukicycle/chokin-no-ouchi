// お知らせ一覧。開いた時点で既読になり、風鈴の朱の点が消える。
// 新しい版のお知らせは、更新するまで一番上に残る。
import { useEffect } from "react";
import { Sheet } from "../ui/Sheet";
import { UpdateNotice } from "../update/UpdateNotice";
import { useNotifications } from "./NotificationsProvider";

const time = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, markAllRead, clearAppNotifications } = useNotifications();
  const hasAppItems = items.some((n) => n.kind === "app");

  useEffect(() => {
    if (open) markAllRead();
  }, [open, markAllRead]);

  return (
    <Sheet open={open} title="お知らせ" onClose={onClose}>
      {items.length === 0 ? (
        <p className="sheet-empty">お知らせはありません。新しい版が出たときもここでお知らせします。</p>
      ) : (
        <ol className="notices">
          {items.map((n) =>
            n.kind === "update" ? (
              <li key={n.id} className="notice">
                <UpdateNotice info={{ version: n.version, date: n.date, notes: n.notes }} />
              </li>
            ) : (
              <li key={n.id} className="notice">
                <p className="notice-head">
                  <span className="notice-title">{n.title}</span>
                  <time className="notice-time">{time.format(n.createdAt)}</time>
                </p>
                {n.body?.map((line) => (
                  <p key={line} className="notice-body">
                    {line}
                  </p>
                ))}
              </li>
            ),
          )}
        </ol>
      )}
      {/* たまにしか使わない片付けは、一覧の一番下に控えめに */}
      {hasAppItems && (
        <button className="text-button sheet-footer-action" onClick={clearAppNotifications}>
          お知らせをすべて消す
        </button>
      )}
    </Sheet>
  );
}
