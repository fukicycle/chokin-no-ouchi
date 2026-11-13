// 「元に戻す」付きのトーストと、確認ダイアログ。
// どちらも親指の届く下側に出す。確認ダイアログは「やめる」を左、実行を右に置く（実行が親指の自然な位置）。
// トーストは墨の面（昼夜で反転）。中身の上に一瞬だけ重なるものなので、ガラスにせず読みやすさを優先する。
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ToastInput = { message: string; actionLabel?: string; onAction?: () => void; duration?: number };
type ConfirmInput = { title: string; message?: string; confirmLabel: string; danger?: boolean };

type Ctx = {
  toast: (t: ToastInput) => void;
  confirm: (c: ConfirmInput) => Promise<boolean>;
};

const FeedbackContext = createContext<Ctx | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastInput & { key: number }) | null>(null);
  const [dialog, setDialog] = useState<(ConfirmInput & { resolve: (ok: boolean) => void }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const confirmButton = useRef<HTMLButtonElement>(null);

  const showToast = useCallback((t: ToastInput) => {
    clearTimeout(timer.current);
    setToast({ ...t, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), t.duration ?? (t.onAction ? 6000 : 3000));
  }, []);

  const confirm = useCallback(
    (c: ConfirmInput) => new Promise<boolean>((resolve) => setDialog({ ...c, resolve })),
    [],
  );

  const close = (ok: boolean) => {
    dialog?.resolve(ok);
    setDialog(null);
  };

  // FAB などがトーストに重ならないよう、表示中は下の余白を伝える
  useEffect(() => {
    document.documentElement.style.setProperty("--app-toast-space", toast ? "64px" : "0px");
  }, [toast]);

  useEffect(() => {
    if (!dialog) return;
    confirmButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <FeedbackContext.Provider value={{ toast: showToast, confirm }}>
      {children}

      {toast && (
        <div className="toast" role="status" key={toast.key}>
          <span className="toast-message">{toast.message}</span>
          {toast.onAction && (
            <button
              className="toast-action"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
            >
              {toast.actionLabel ?? "元に戻す"}
            </button>
          )}
        </div>
      )}

      {dialog && (
        <div className="scrim scrim--dialog" onClick={() => close(false)}>
          <div
            className="dialog fk-glass"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fk-glass-bd" />
            <div className="fk-glass-in">
              <h2 id="dialog-title" className="dialog-title">
                {dialog.title}
              </h2>
              {dialog.message && <p className="dialog-message">{dialog.message}</p>}
              <div className="dialog-actions">
                <button className="fk-button" onClick={() => close(false)}>
                  やめる
                </button>
                <button
                  ref={confirmButton}
                  className={dialog.danger ? "fk-button fk-button--danger" : "fk-button fk-button--primary"}
                  onClick={() => close(true)}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback は FeedbackProvider の中で使う");
  return ctx;
}
