// ログイン前の画面。何ができるアプリかを一言で伝え、ログインのボタンだけを置く。
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Icon } from "../ui/Icon";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="page login">
      <p className="login-title">家族の家計を、ひとつのおうちで。</p>
      <p className="lead">
        記録した支出は家族で共有されます。レシートの読み取り、固定費の自動記録、今月の使いすぎの見通しまで、ここでまとめて見られます。
      </p>
      <button
        className="fk-button fk-button--primary fk-button--block"
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
        Google でログイン
      </button>
      {error && (
        <p className="status-error" role="alert">
          <Icon name="error" size="sm" /> {error}
        </p>
      )}
    </div>
  );
}
