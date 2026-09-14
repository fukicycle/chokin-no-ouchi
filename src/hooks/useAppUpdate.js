import { useCallback, useEffect, useRef, useState } from "react";
import { APP_BUILD_ID, APP_VERSION, VERSION_MANIFEST_URL } from "../utils/appVersion";

/**
 * ユーザーが任意のタイミングでアプリを最新版にできるようにするフック。
 *
 * PWAはService Worker/HTTPキャッシュの都合で「開き直しても古いまま」に
 * なることがある。そこで配信中の version.json を no-store で取り、
 * 実行中のビルド(APP_BUILD_ID)と違えば更新ありとみなす。
 * 適用時はキャッシュを掃除したうえで index.html を取り直してから再読込する。
 *
 * status: "idle" | "checking" | "latest" | "available" | "applying" | "error"
 */
export function useAppUpdate() {
  const [status, setStatus] = useState("idle");
  const [latestInfo, setLatestInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);

  // アンマウント後に setState しないためのフラグ
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (!mountedRef.current) return null;
    setStatus("checking");
    setErrorMessage(null);

    try {
      // Service Worker側にも新版がないか問い合わせる (待機中のworkerを拾うため)
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update().catch(() => {});
      }

      const response = await fetch(`${VERSION_MANIFEST_URL}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const info = await response.json();
      if (!mountedRef.current) return info;

      setLatestInfo(info);
      setLastCheckedAt(new Date());

      const hasUpdate = Boolean(info?.buildId) && info.buildId !== APP_BUILD_ID;
      setStatus(hasUpdate ? "available" : "latest");
      return info;
    } catch (error) {
      console.error("アップデート確認エラー:", error);
      if (mountedRef.current) {
        setErrorMessage(
          "最新バージョンの確認に失敗しました。通信環境を確認して再度お試しください。"
        );
        setStatus("error");
      }
      return null;
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    setStatus("applying");
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update().catch(() => {});
          // 待機中の新しいworkerがいれば即座に引き継がせる。
          // 登録自体は解除しない (解除するとプッシュ購読も失われるため)。
          registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        }
      }

      // Service Workerやブラウザが抱えているキャッシュを破棄する
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      // index.html を強制的に取り直してHTTPキャッシュを新しくしてから再読込する。
      // (reload() だけだと古い index.html が再利用されることがある)
      await fetch(`${import.meta.env.BASE_URL}index.html`, { cache: "reload" }).catch(
        () => {}
      );
    } catch (error) {
      console.error("アップデート適用エラー:", error);
    } finally {
      window.location.reload();
    }
  }, []);

  // 設定画面を開いたタイミングで一度だけ静かに確認する
  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return {
    currentVersion: APP_VERSION,
    currentBuildId: APP_BUILD_ID,
    latestInfo,
    status,
    errorMessage,
    lastCheckedAt,
    isChecking: status === "checking",
    isApplying: status === "applying",
    updateAvailable: status === "available",
    checkForUpdate,
    applyUpdate,
  };
}
