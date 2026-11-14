// 全画面共通の枠。
// ┌ トップバー：戻る（2階層目から左上）・画面名・通知（風鈴）・設定（歯車、一番右）。中身の上に浮くガラス
// ├ 中身：ここだけスクロールする（一番外側は動かない）。トップバー・タブバーの下を流れる
// ├ 記録する：タブの画面ではいつも右下の同じ位置（どの画面を見ていても、買い物の直後に片手で押せるように）
// └ タブバー：中身の上に浮くガラス
//
// スクロール位置の決まり
// - タブの画面（ちょきん・きろく・あゆみ）は、一度開いたら消さずに隠しておく。
//   行き来しても、スクロール位置・開いている月・読み込んだ記録がそのまま残る（読み込み直しでガクンと動かない）
// - 設定の画面は開くたびに描き、画面ごとに前に見ていた位置へ戻す
import { useLayoutEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useMatches, useNavigate } from "react-router";
import config from "../../app.config";
import { useAuth } from "../auth/AuthProvider";
import { useFixedCostSync } from "../data/hooks";
import { EntryProvider, useEntry } from "../entry/EntryProvider";
import { NotificationsSheet } from "../notifications/NotificationsSheet";
import { useNotifications } from "../notifications/NotificationsProvider";
import { LoginScreen } from "../screens/LoginScreen";
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

const tabs = config.tabs.slice(0, 4);
const rootPaths = tabs.map((t) => t.path);

// 設定の画面ごとのスクロール位置
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
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const title = [...matches]
    .reverse()
    .map((m) => (m.handle as RouteHandle | undefined)?.title)
    .find(Boolean);

  const isRoot = rootPaths.includes(location.pathname);
  const activeTab = tabs.findIndex((t) => t.path === location.pathname);

  // 一度開いたタブの画面は残しておく（最初から全部は描かない）
  const [visited, setVisited] = useState<string[]>(isRoot ? [location.pathname] : []);
  if (isRoot && !visited.includes(location.pathname)) setVisited([...visited, location.pathname]);

  // 設定の画面は、その画面で前に見ていた位置に戻す（初めての画面は一番上）
  const page = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (page.current) page.current.scrollTop = scrollPositions.get(location.pathname) ?? 0;
  }, [location.pathname]);

  const inSettings = location.pathname.startsWith("/settings");
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
      {/* トップバーは中身の上に浮くガラス。中身はこの下を流れる */}
      <header className="topbar fk-glass">
        <div className="fk-glass-bd" />
        <div className="fk-glass-in">
          {!isRoot && (
            <button className="fk-icon-button fk-icon-button--flat" aria-label="戻る" onClick={goBack}>
              <Icon name="back" />
            </button>
          )}
          <h1 className={isRoot ? "topbar-title topbar-title--app" : "topbar-title"}>
            {title ?? config.name}
          </h1>
          <div className="topbar-actions">
            <button
              className="fk-icon-button fk-icon-button--flat notify-button"
              aria-label={hasUnread ? "お知らせ（未読あり）" : "お知らせ"}
              onClick={() => setNoticesOpen(true)}
            >
              <Icon name="notify" />
              {hasUnread && <span className="badge" aria-hidden="true" />}
            </button>
            {!inSettings && (
              <button
                className="fk-icon-button fk-icon-button--flat"
                aria-label="設定"
                onClick={() => navigate("/settings")}
              >
                <Icon name="settings" />
              </button>
            )}
          </div>
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
            onScroll={(e) => scrollPositions.set(location.pathname, e.currentTarget.scrollTop)}
          >
            <Outlet />
          </main>
        )}
      </div>

      {user && <FixedCostSync />}

      {/* 記録する：いちばん多い操作。タブの画面ではいつも右下（親指の届く所）の同じ位置に置く */}
      {user && isRoot && <Fab label="記録する" onClick={openNew} />}

      {/* 設定は別の場所として開くので、タブバーは出さない（戻るで元の画面へ） */}
      {isRoot && (
        <nav className="tabbar fk-glass" aria-label="画面の切り替え">
          <div className="fk-glass-bd" />
          <div className="fk-glass-in">
            {/* 選んでいるタブの沈み。タブを替えると、次のタブへすべって移る */}
            <span
              className="tab-indicator"
              aria-hidden="true"
              style={{
                width: `calc((100% - 8px) / ${tabs.length})`,
                transform: `translateX(${Math.max(activeTab, 0) * 100}%)`,
                opacity: activeTab < 0 ? 0 : 1,
              }}
            />
            {tabs.map((t) => (
              <NavLink
                key={t.path}
                to={t.path}
                end
                className="tab"
                // 今いるタブをもう一度押したら、一番上へ戻る
                onClick={() => {
                  if (t.path !== location.pathname) return;
                  document.querySelector(`[data-pane="${t.path}"]`)?.scrollTo({ top: 0, behavior: "smooth" });
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
      )}

      <NotificationsSheet open={noticesOpen} onClose={() => setNoticesOpen(false)} />
    </div>
  );
}
