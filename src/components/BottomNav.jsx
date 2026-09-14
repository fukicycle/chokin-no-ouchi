import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faChartPie,
  faListUl,
  faGear,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

const TABS = [
  { key: "home", label: "ホーム", icon: faHouse },
  { key: "insights", label: "分析", icon: faChartPie },
  { key: "history", label: "履歴", icon: faListUl },
  { key: "settings", label: "設定", icon: faGear },
];

const BottomNav = ({ activeTab, onTabChange, onAddClick }) => {
  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  const renderTab = (tab) => {
    const isActive = activeTab === tab.key;
    return (
      <button
        key={tab.key}
        onClick={() => onTabChange(tab.key)}
        className="flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200"
      >
        <FontAwesomeIcon
          icon={tab.icon}
          className={`text-lg transition-all duration-200 ${
            isActive
              ? "text-cyan-800 dark:text-cyan-400 -translate-y-0.5"
              : "text-slate-400 dark:text-slate-500"
          }`}
        />
        <span
          className={`text-[10px] font-extrabold tracking-wide transition-colors duration-200 ${
            isActive
              ? "text-cyan-800 dark:text-cyan-400"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    // position:fixed はレイアウトビューポート基準になり、iOSのstandalone PWAでは
    // それが画面より短いことがあるため画面下端に届かない。
    // .app-shell(縦flex)の最後の要素としてフローに置き、確実に最下部へ置く。
    // 下余白はフッターの内側に持たせる。iOSのstandalone PWAでは
    // env(safe-area-inset-bottom) が 0 で返ることがあり、それだけに頼ると
    // ラベルがホームインジケーターと重なるため、最低20pxは必ず確保する。
    <nav className="bottom-nav relative z-40 shrink-0 pb-[max(20px,env(safe-area-inset-bottom,0px))]">
      <div className="max-w-lg mx-auto relative flex items-stretch h-16 px-2">
        {leftTabs.map(renderTab)}

        {/* 中央の浮き出た追加ボタン */}
        <div className="flex-1 flex items-center justify-center relative">
          <button
            onClick={onAddClick}
            className="bottom-nav-fab absolute -top-6 w-14 h-14 flex items-center justify-center rounded-full text-white bg-gradient-to-br from-cyan-500 to-pink-500 hover:scale-105 active:scale-95 transition-all duration-200"
            title="支出を追加"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xl" />
          </button>
        </div>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
};

export default BottomNav;
