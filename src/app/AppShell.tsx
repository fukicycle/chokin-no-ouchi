// 全画面共通の枠。
// ┌ トップバー：地にそのまま置く（ガラスにしない）。戻る（2階層目から左上）・画面名・通知（右上）だけ。
// │            一番上にいるときは地と一続き。少しでもスクロールしたら下端に溝を彫る
// ├ 中身：ここだけスクロールする（一番外側は動かない）。トップバーの下端で切れ、タブバーの下は流れる
// ├ 記録する：タブの画面ではいつも右下の同じ位置（どの画面を見ていても、買い物の直後に片手で押せるように）
// └ タブバー：中身の上に浮くガラス。ちょきん・きろく・あゆみ＋右端に設定（設定は思ったより開くので、片手で届く所に）
//
// スクロール位置の決まり
// - タブの画面（ちょきん・きろく・あゆみ）は、一度開いたら消さずに隠しておく。
//   行き来しても、スクロール位置・開いている月・読み込んだ記録がそのまま残る（読み込み直しでガクンと動かない）
// - 設定の画面は開くたびに描き、画面ごとに前に見ていた位置へ戻す
import { useLayoutEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useMatches, useNavigate } from "react-router";
import config from "../../app.config";
import type { TabConfig } from "../config/types";
import { useAuth } from "../auth/AuthProvider";
import { useFixedCostSync } from "../data/hooks";
import { EntryProvider, useEntry } from "../entry/EntryProvider";
import { NotificationsSheet } from "../notifications/NotificationsSheet";
import { useNotifications } from "../notifications/NotificationsProvider";
import { LoginScreen } from "../screens/LoginScreen";
import { useRecordsView } from "../screens/recordsView";
import { dayKey } from "../lib/format";
import { Fab } from "../ui/Fab";
import { Icon } from "../ui/Icon";
import { tabScreens } from "./tabScreens";

/** 固定費の自動計上。計上したらお知らせに残す（風鈴に点が付く） */
function FixedCostSync() {
  const { push } = useNotifications();
  useFixedCostSync((count, names) =>
    push({ title: `固定費を${count}件記録しました`, body: [names.join("、")] }),
  );
  return null;
}

export type RouteHandle = { title?: string };

// アプリの画面のタブは3つまで。右端に設定を足す（DESIGN.md 8）
const appTabs = config.tabs.slice(0, 3);
const settingsTab: TabConfig = { path: "/settings", label: "設定", icon: "settings" };
const tabs = [...appTabs, settingsTab];
const rootPaths = appTabs.map((t) => t.path);

const isSettingsPath = (path: string) => path === "/settings" || path.startsWith("/settings/");

// 画面ごとのスクロール位置。設定の画面は開き直したときにここへ戻す。
// タブの画面は消さずに持っているので戻す必要はなく、トップバーの溝を出すかどうかにだけ使う
const scrollPositions = new Map<string, number>();

/** 記録のシートは道筋の中（設定へ進めるように）、かつ全画面の外側に置く */
export function AppShell() {
  return (
    <EntryProvider>
      <Shell />
    </EntryProvider>
  );
}

function Shell() {
  const [noticesOpen, setNoticesOpen] = useState(false);
  const { hasUnread } = useNotifications();
  const { openNew } = useEntry();
  const { focus } = useRecordsView();
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const path = location.pathname;
  // 画面名：ちょきん（一番左）はアプリ名。ほかは route の handle、なければタブのラベル
  const handleTitle = [...matches]
    .reverse()
    .map((m) => (m.handle as RouteHandle | undefined)?.title)
    .find(Boolean);
  const isHome = path === appTabs[0].path;
  const title = isHome
    ? config.name
    : (handleTitle ?? appTabs.find((t) => t.path === path)?.label ?? config.name);

  // タブの画面（消さずに持っておく）か。設定の一番上はタブだが、開くたびに描く画面
  const isRoot = rootPaths.includes(path);
  const showBack = !isRoot && path !== "/settings";
  // 「きろく」で選んでいる、今日より前の日
  const backfill =
    location.pathname === "/records" && focus?.kind === "day" && focus.key < dayKey(new Date())
      ? focus.key
      : null;
  const inSettings = isSettingsPath(path);
  const activeTab = inSettings ? tabs.length - 1 : appTabs.findIndex((t) => t.path === path);

  // 一度開いたタブの画面は残しておく（最初から全部は描かない）
  const [visited, setVisited] = useState<string[]>(isRoot ? [location.pathname] : []);
  if (isRoot && !visited.includes(location.pathname)) setVisited([...visited, location.pathname]);

  // 設定の画面は、その画面で前に見ていた位置に戻す（初めての画面は一番上）
  const page = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (page.current) page.current.scrollTop = scrollPositions.get(location.pathname) ?? 0;
  }, [location.pathname]);

  // スクロールしているか（トップバーの溝）。画面を替えた直後は、その画面で前に見ていた位置から決める
  const [scrollState, setScrollState] = useState({ path, scrolled: false });
  const scrolled = scrollState.path === path ? scrollState.scrolled : (scrollPositions.get(path) ?? 0) > 0;
  const onPaneScroll = (paneOf: string, top: number) => {
    scrollPositions.set(paneOf, top);
    if (paneOf === path && top > 0 !== scrolled) setScrollState({ path, scrolled: top > 0 });
  };

  const { user, loading } = useAuth();
  // ログインしていなくても設定（テーマなど）とお知らせは開ける。ほかの画面はログイン画面に置き換える
  const gated = !inSettings && (loading || !user);

  const goBack = () => {
    // アプリ内の履歴があれば戻る。直接開いたときは一つ上の画面へ
    if (location.key !== "default") navigate(-1);
    else navigate(inSettings && location.pathname !== "/settings" ? "/settings" : "/");
  };

  // ログイン前はトップバーもタブバーも出さず、ログインのボタンだけにする
  if (gated) {
    return <div className="shell">{loading ? null : <LoginScreen />}</div>;
  }

  return (
    <div className="shell">
      {/* トップバーは地にそのまま置く。スクロールしたら下端に溝（中身が上に潜っている合図） */}
      <header className={scrolled ? "topbar is-scrolled" : "topbar"}>
        <div className="topbar-in">
          {showBack && (
            <button
              className="fk-icon-button fk-icon-button--flat topbar-back"
              aria-label="戻る"
              onClick={goBack}
            >
              <Icon name="back" />
            </button>
          )}
          <h1 className={isHome ? "topbar-title topbar-title--app" : "topbar-title"}>{title}</h1>
          {/* トップバーの操作はこれだけなので、地に埋もれないよう浮いた丸にする */}
          <button
            className="fk-icon-button notify-button"
            aria-label={hasUnread ? "お知らせ（未読あり）" : "お知らせ"}
            onClick={() => setNoticesOpen(true)}
          >
            <Icon name="notify" />
            {hasUnread && <span className="badge" aria-hidden="true" />}
          </button>
        </div>
      </header>

      <div className="panes">
        {user &&
          tabs.map((t) =>
            visited.includes(t.path) ? (
              <main
                key={t.path}
                className={
                  t.path === location.pathname
                    ? "shell-main fk-scroll pane is-active"
                    : "shell-main fk-scroll pane"
                }
                inert={t.path !== location.pathname}
                data-pane={t.path}
                onScroll={(e) => onPaneScroll(t.path, e.currentTarget.scrollTop)}
              >
                {tabScreens[t.path]}
              </main>
            ) : null,
          )}
        {!isRoot && (
          <main
            key={location.pathname}
            ref={page}
            className="shell-main fk-scroll pane pane--page is-active"
            data-pane={location.pathname}
            onScroll={(e) => onPaneScroll(location.pathname, e.currentTarget.scrollTop)}
          >
            <Outlet />
          </main>
        )}
      </div>

      {user && <FixedCostSync />}

      {/* 記録する：いちばん多い操作。タブの画面ではいつも右下（親指の届く所）の同じ位置に置く。
          「きろく」の暦で今日より前の日を選んでいる間は、その日付で書き始める（書き忘れを後から入れる所）。
          何が起きるか分かるよう、ラベルも「14日に記録」に変える */}
      {user && isRoot && (
        <Fab
          label={backfill ? `${Number(backfill.slice(8))}日に記録` : "記録する"}
          onClick={() => openNew(backfill ?? undefined)}
        />
      )}

      {/* タブバーはどの画面でも出す。設定の中の画面でも、設定のタブを選んだまま */}
      <nav className="tabbar fk-glass" aria-label="画面の切り替え">
        <div className="fk-glass-bd" />
        <div className="fk-glass-in">
          {/* 選んでいるタブの沈み。タブを替えると、次のタブへすべって移る */}
          <span
            className="tab-indicator"
            aria-hidden="true"
            style={{
              width: `calc((100% - var(--fk-space-2)) / ${tabs.length})`,
              transform: `translateX(${Math.max(activeTab, 0) * 100}%)`,
              opacity: activeTab < 0 ? 0 : 1,
            }}
          />
          {tabs.map((t) => (
            <NavLink
              key={t.path}
              to={t.path}
              end={t !== settingsTab}
              className="tab"
              // 今いるタブをもう一度押したら、一番上へ戻る（設定の中の画面からは、設定の一番上へ）
              onClick={() => {
                if (t.path !== location.pathname) return;
                const pane = document.querySelector(`[data-pane="${t.path}"]`);
                // 中に自前のスクロール領域を持つ画面（きろく）は、そちらを戻す
                (pane?.querySelector("[data-scroll-top]") ?? pane)?.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon name={t.icon} glass={isActive} />
                  <span className="tab-label">{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <NotificationsSheet open={noticesOpen} onClose={() => setNoticesOpen(false)} />
    </div>
  );
}
