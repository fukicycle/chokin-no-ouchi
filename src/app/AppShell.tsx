// 全画面共通の枠。
// ┌ トップバー：戻る（2階層目から左上）・画面名・通知（風鈴）・設定（歯車、一番右）。中身の上に浮くガラス
// ├ 中身：ここだけスクロールする（一番外側は動かない）。トップバー・タブバーの下を流れる
// └ タブバー：一番上の画面が2つ以上のときだけ。中身の上に浮くのでガラスにする
import { useState } from "react";
import { NavLink, Outlet, useLocation, useMatches, useNavigate } from "react-router";
import config from "../../app.config";
import { NotificationsSheet } from "../notifications/NotificationsSheet";
import { useNotifications } from "../notifications/NotificationsProvider";
import { Icon } from "../ui/Icon";
import { useAuth } from "../auth/AuthProvider";
import { useFixedCostSync } from "../data/hooks";
import { LoginScreen } from "../screens/LoginScreen";

/** 固定費の自動計上。計上したらお知らせに残す（風鈴に点が付く） */
function FixedCostSync() {
  const { push } = useNotifications();
  useFixedCostSync((count, names) =>
    push({ title: `固定費を${count}件記録しました`, body: [names.join("、")] }),
  );
  return null;
}

export type RouteHandle = { title?: string };

const tabs = config.tabs.length >= 2 ? config.tabs.slice(0, 4) : [];
const rootPaths = tabs.length ? tabs.map((t) => t.path) : ["/"];

export function AppShell() {
  const [noticesOpen, setNoticesOpen] = useState(false);
  const { hasUnread } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const title = [...matches]
    .reverse()
    .map((m) => (m.handle as RouteHandle | undefined)?.title)
    .find(Boolean);

  const isRoot = rootPaths.includes(location.pathname);
  const inSettings = location.pathname.startsWith("/settings");
  const { user, loading } = useAuth();
  // ログインしていなくても設定（テーマなど）とお知らせは開ける。ほかの画面はログイン画面に置き換える
  const gated = !inSettings && (loading || !user);

  const goBack = () => {
    // アプリ内の履歴があれば戻る。直接開いたときは一つ上の画面へ
    if ((window.history.state as { idx?: number } | null)?.idx) navigate(-1);
    else navigate(inSettings && location.pathname !== "/settings" ? "/settings" : "/");
  };

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

      <main key={location.pathname} className="shell-main fk-scroll">
        {!gated ? <Outlet /> : loading ? null : <LoginScreen />}
      </main>

      {/* 設定は別の場所として開くので、タブバーは出さない（戻るで元の画面へ） */}
      {user && <FixedCostSync />}

      {tabs.length > 0 && !inSettings && !gated && (
        <nav className="tabbar fk-glass" aria-label="画面の切り替え">
          <div className="fk-glass-bd" />
          <div className="fk-glass-in">
            {tabs.map((t) => (
              <NavLink key={t.path} to={t.path} end className="tab">
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
