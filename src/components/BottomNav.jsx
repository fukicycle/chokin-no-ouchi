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
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom,0px)]">
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
