// 新しい版の確認と切り替え。
// - 起動時と1時間ごとに version.json を確認する（キャッシュしない）
// - 新しい版があれば Service Worker に裏で取得させておく。お知らせは通知一覧に出る
// - 切り替えるのは、ユーザーが［更新する］を押したときだけ
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { compareVersions, type VersionInfo } from "../lib/releaseNotes";

const CHECK_INTERVAL = 60 * 60 * 1000;

export const currentVersion: VersionInfo = {
  version: __APP_VERSION__,
  date: __APP_DATE__,
  notes: __RELEASE_NOTES__.find((n) => n.version === __APP_VERSION__)?.items ?? [],
};

type UpdateState = {
  current: VersionInfo;
  /** 自分より新しい版。なければ null */
  latest: VersionInfo | null;
  checking: boolean;
  lastChecked: number | null;
  error: string | null;
  applying: boolean;
  check: () => Promise<void>;
  apply: () => void;
};

const UpdateContext = createContext<UpdateState | null>(null);

/** 開発中に ?simulate-update を付けて開くと、新しい版があるふりをする（見た目の確認用） */
function simulated(): VersionInfo | null {
  if (!import.meta.env.DEV || !new URLSearchParams(location.search).has("simulate-update")) return null;
  const [major, minor] = __APP_VERSION__.split(".").map(Number);
  return {
    version: `${major}.${minor + 1}.0`,
    date: new Date().toISOString().slice(0, 10),
    notes: [
      "（開発用の仮のお知らせです）一覧を並び替えられるようになりました",
      "暗いテーマで文字が読みにくかったのを直しました",
    ],
  };
}

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [latest, setLatest] = useState<VersionInfo | null>(simulated);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const registration = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const lastCheckedRef = useRef<number | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, r) {
      registration.current = r;
    },
  });

  const check = useCallback(async () => {
    if (simulated()) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(String(res.status));
      const info = (await res.json()) as VersionInfo;
      if (compareVersions(info.version, __APP_VERSION__) > 0) {
        setLatest(info);
        // 押されたらすぐ切り替えられるよう、裏で取得しておく
        registration.current?.update().catch(() => {});
      } else {
        setLatest(null);
      }
      lastCheckedRef.current = Date.now();
      setLastChecked(lastCheckedRef.current);
    } catch {
      setError("確認できませんでした。電波の届く所でもう一度試してください。");
    } finally {
      setChecking(false);
    }
  }, []);

  // 起動時と1時間ごと。しばらく裏にあったアプリが前に出てきたときも、1時間たっていれば確認する
  useEffect(() => {
    const first = setTimeout(check, 0);
    const timer = setInterval(check, CHECK_INTERVAL);
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - (lastCheckedRef.current ?? 0) > CHECK_INTERVAL
      )
        check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check]);

  const apply = useCallback(() => {
    setApplying(true);
    if (needRefresh) {
      updateServiceWorker(true);
      return;
    }
    const r = registration.current;
    if (!r) {
      // Service Worker がない（開発中など）：読み込み直すだけ
      location.reload();
      return;
    }
    // まだ取得できていなければ取りに行き、準備ができたら切り替える（下の effect）
    r.update().catch(() => {});
    setTimeout(() => location.reload(), 15000);
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    if (applying && needRefresh) updateServiceWorker(true);
  }, [applying, needRefresh, updateServiceWorker]);

  return (
    <UpdateContext.Provider
      value={{ current: currentVersion, latest, checking, lastChecked, error, applying, check, apply }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const ctx = useContext(UpdateContext);
  if (!ctx) throw new Error("useUpdate は UpdateProvider の中で使う");
  return ctx;
}
