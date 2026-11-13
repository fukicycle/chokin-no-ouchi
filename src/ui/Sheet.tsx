// 下から出るシート。中身を読んで、親指の届く下側で操作できるようにする。
// 閉じるボタンは右上。背景を押しても、Escape でも閉じる。
// 引っぱって閉じる操作は入れていないので、つまみ（ハンドル）も描かない。
// 画面のどこから開いても、タブバーやトップバーより手前に出るよう body の直下に描く
// （中身の領域の中に描くと、iPhone の Safari ではタブバーの下に潜って下のボタンが押せなくなる）。
//
// 開くときは下からせり上がり、閉じるときは下へ戻ってから消える（いきなり消さない）。
// 閉じるボタン・背景・Escape で閉じたときは、戻りきってから onClose を呼ぶ。
// 親が open を false にしたときも、戻る動きを見せてから消す。
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode };

export function Sheet({ open, title, onClose, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  // 画面に出しているか／閉じる動きの途中か
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  // 閉じる動きのあとに onClose を呼ぶか（自分で閉じたとき）
  const notify = useRef(false);

  // 親が開いた・閉じた（描画中に合わせる：effect で合わせると一瞬ずれた画面が出る）
  if (open && !mounted) {
    setMounted(true);
    setLeaving(false);
  }
  if (!open && mounted && !leaving) setLeaving(true);

  const close = () => {
    if (leaving) return;
    notify.current = true;
    setLeaving(true);
  };
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    if (!mounted || leaving) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, leaving]);

  // 戻る動きが終わったら消す
  const onAnimationEnd = (e: React.AnimationEvent) => {
    if (!leaving || e.target !== panel.current) return;
    setMounted(false);
    setLeaving(false);
    if (notify.current) {
      notify.current = false;
      onClose();
    }
  };

  if (!mounted) return null;
  return createPortal(
    <div className={leaving ? "scrim scrim--bottom is-leaving" : "scrim scrim--bottom"} onClick={close}>
      <div
        ref={panel}
        className="sheet fk-glass"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={onAnimationEnd}
      >
        <div className="fk-glass-bd" />
        <div className="fk-glass-in">
          <header className="sheet-header">
            <h2 className="sheet-title">{title}</h2>
            <button className="fk-icon-button" aria-label="閉じる" onClick={close}>
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
