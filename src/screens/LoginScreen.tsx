// ログイン前の画面。Google でログインするボタンだけを、親指の届く画面の中ほどに置く。
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Icon } from "../ui/Icon";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="login">
      <button
        className="fk-button fk-button--primary login-button"
        disabled={busy}
        onClick={async () => {
          setError(null);
          setBusy(true);
          try {
            await signIn();
          } catch (e) {
            const code = (e as { code?: string }).code ?? "";
            if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
              setError("ログインできませんでした。電波の届く所で、もう一度試してください。");
            }
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "ログインしています…" : "Google でログイン"}
      </button>
      {error && (
        <p className="status-error" role="alert">
          <Icon name="error" size="sm" /> {error}
        </p>
      )}
    </div>
  );
}
