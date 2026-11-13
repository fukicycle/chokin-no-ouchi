// 下から出るシート。中身を読んで、親指の届く下側で操作できるようにする。
// 閉じるボタンは右上。背景を押しても、Escape でも閉じる。
// 引っぱって閉じる操作は入れていないので、つまみ（ハンドル）も描かない。
// 画面のどこから開いても、タブバーやトップバーより手前に出るよう body の直下に描く
// （中身の領域の中に描くと、iPhone の Safari ではタブバーの下に潜って下のボタンが押せなくなる）。
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode };

export function Sheet({ open, title, onClose, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="scrim scrim--bottom" onClick={onClose}>
      <div
        ref={panel}
        className="sheet fk-glass"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fk-glass-bd" />
        <div className="fk-glass-in">
          <header className="sheet-header">
            <h2 className="sheet-title">{title}</h2>
            <button className="fk-icon-button" aria-label="閉じる" onClick={onClose}>
              <Icon name="close" />
            </button>
          </header>
          <div className="sheet-body fk-scroll">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
