import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faCircleCheck,
  faRotate,
  faCloudArrowDown,
  faScaleBalanced,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useAppUpdate } from "../hooks/useAppUpdate";
import { APP_BUILD_TIME, formatBuildTime } from "../utils/appVersion";
import OssLicenseDialog from "./OssLicenseDialog";

/**
 * バージョン情報の表示と、ユーザーが任意のタイミングで実行できる
 * アップデート操作、そしてOSSライセンス表示への導線をまとめたセクション。
 */
const AppInfoSection = () => {
  const {
    currentVersion,
    currentBuildId,
    latestInfo,
    status,
    errorMessage,
    lastCheckedAt,
    isChecking,
    isApplying,
    updateAvailable,
    checkForUpdate,
    applyUpdate,
  } = useAppUpdate();

  const [isLicenseOpen, setIsLicenseOpen] = useState(false);

  const buildTimeLabel = formatBuildTime(APP_BUILD_TIME);
  const latestBuildTimeLabel = formatBuildTime(latestInfo?.buildTime);

  const statusStyles = {
    available: {
      icon: faCloudArrowDown,
      className: "text-amber-600 dark:text-amber-400",
      message: `新しいバージョン (v${latestInfo?.version ?? "?"}${
        latestBuildTimeLabel ? ` / ${latestBuildTimeLabel}` : ""
      }) が公開されています。`,
    },
    latest: {
      icon: faCircleCheck,
      className: "text-emerald-600 dark:text-emerald-400",
      message: "お使いのバージョンは最新です。",
    },
    error: {
      icon: faTriangleExclamation,
      className: "text-rose-600 dark:text-rose-400",
      message: errorMessage,
    },
  };

  const currentStatus = statusStyles[status];

  return (
    <section className="glass-card rounded-3xl p-6 space-y-5 text-text-dark dark:text-gray-100">
      <div className="flex items-center space-x-2">
        <FontAwesomeIcon icon={faCircleInfo} className="text-cyan-800 dark:text-cyan-400 text-base" />
        <h3 className="text-lg font-black text-slate-800 dark:text-white">アプリ情報</h3>
      </div>

      {/* バージョン情報 */}
      <div className="space-y-2 bg-white/20 dark:bg-black/10 border border-white/40 dark:border-white/5 rounded-2xl p-3.5 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">バージョン</span>
          <span className="text-base font-black text-slate-800 dark:text-white">
            v{currentVersion}
          </span>
        </div>
        {buildTimeLabel && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">ビルド日時</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {buildTimeLabel}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">ビルドID</span>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
            {currentBuildId}
          </span>
        </div>
      </div>

      {/* アップデート */}
      <div className="space-y-3">
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
          このアプリはホーム画面に追加して使えるPWAのため、新しい版が公開されても
          自動では切り替わらないことがあります。好きなタイミングで下のボタンから
          最新版に更新できます。
        </p>

        {currentStatus && currentStatus.message && (
          <div
            className={`flex items-start space-x-2 text-xs font-bold ${currentStatus.className}`}
          >
            <FontAwesomeIcon icon={currentStatus.icon} className="mt-0.5 shrink-0" />
            <span className="leading-relaxed">{currentStatus.message}</span>
          </div>
        )}

        {lastCheckedAt && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
            最終確認: {lastCheckedAt.toLocaleTimeString("ja-JP")}
          </p>
        )}

        <div className="flex space-x-2">
          <button
            onClick={checkForUpdate}
            disabled={isChecking || isApplying}
            className="flex-1 py-3 flex items-center justify-center space-x-2 text-cyan-800 dark:text-cyan-300 bg-cyan-500/10 dark:bg-cyan-950/40 border border-cyan-500/20 dark:border-cyan-800/20 rounded-xl font-bold text-sm hover:bg-cyan-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faRotate} className={isChecking ? "animate-spin" : ""} />
            <span>{isChecking ? "確認中..." : "更新を確認"}</span>
          </button>

          <button
            onClick={applyUpdate}
            disabled={isApplying || isChecking}
            className={`flex-1 py-3 flex items-center justify-center space-x-2 rounded-xl font-bold text-sm shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white ${
              updateAvailable
                ? "bg-amber-600 dark:bg-amber-600 hover:bg-amber-700 dark:hover:bg-amber-500"
                : "bg-cyan-800 dark:bg-cyan-700 hover:bg-cyan-900 dark:hover:bg-cyan-600"
            }`}
          >
            <FontAwesomeIcon icon={faCloudArrowDown} />
            <span>
              {isApplying ? "更新中..." : updateAvailable ? "最新版に更新" : "再読み込みして更新"}
            </span>
          </button>
        </div>
      </div>

      <div className="border-t border-white/30 dark:border-white/5" />

      {/* OSSライセンス */}
      <div className="space-y-2">
        <button
          onClick={() => setIsLicenseOpen(true)}
          className="w-full py-3.5 flex items-center justify-center space-x-2 text-slate-700 dark:text-slate-200 bg-white/30 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl font-bold hover:bg-white/45 dark:hover:bg-black/30 transition-all duration-200 active:scale-[0.98]"
        >
          <FontAwesomeIcon icon={faScaleBalanced} className="text-cyan-800 dark:text-cyan-400" />
          <span className="text-sm">オープンソースライセンス</span>
        </button>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
          このアプリはオープンソースソフトウェアを利用しています。著作権表示と
          ライセンス全文はこちらからご確認いただけます。
        </p>
      </div>

      {isLicenseOpen && <OssLicenseDialog onClose={() => setIsLicenseOpen(false)} />}
    </section>
  );
};

export default AppInfoSection;
