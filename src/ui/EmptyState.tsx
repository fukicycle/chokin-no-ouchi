import type { ReactNode } from "react";

/**
 * 何もない画面。飾りの絵は置かず、「次に何をすればいいか」を一言で伝える。
 * 例：<EmptyState title="まだ何もありません">右下の［追加］から始められます。</EmptyState>
 */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children && <p className="empty-text">{children}</p>}
    </div>
  );
}
