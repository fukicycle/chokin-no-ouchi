import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal";
import { OSS_LICENSES } from "../data/ossLicenses";

/**
 * OSSライセンス表示ダイアログ。
 * MIT/BSD系は著作権表示とライセンス全文の同梱が条件なので、
 * 要約ではなく全文をそのまま読めるようにしている。
 */
const OssLicenseDialog = ({ onClose }) => {
  const [expandedPackage, setExpandedPackage] = useState(null);

  return (
    <Modal onClose={onClose} title="オープンソースライセンス">
      <div className="space-y-4">
        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-bold">
          「貯金のおうち」は以下のオープンソースソフトウェアを利用しています。
          各ソフトウェアの著作権は、それぞれの権利者に帰属します。
          パッケージ名をタップするとライセンス全文が表示されます。
        </p>

        <ul className="space-y-2">
          {OSS_LICENSES.map((item) => {
            const isExpanded = expandedPackage === item.packageName;
            return (
              <li
                key={item.packageName}
                className="bg-white/25 dark:bg-black/20 border border-white/40 dark:border-white/5 rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedPackage(isExpanded ? null : item.packageName)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                      v{item.version} ・ {item.license}
                    </span>
                  </div>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`shrink-0 text-xs text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    <a
                      href={item.homepage}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center space-x-1.5 text-[11px] font-black text-cyan-800 dark:text-cyan-400 hover:underline break-all"
                    >
                      <span>{item.homepage}</span>
                      <FontAwesomeIcon icon={faUpRightFromSquare} className="text-[9px]" />
                    </a>
                    <pre className="max-h-56 overflow-auto overscroll-contain whitespace-pre-wrap break-words bg-white/40 dark:bg-black/30 border border-white/40 dark:border-white/5 rounded-xl p-3 text-[10px] leading-relaxed font-mono text-slate-700 dark:text-slate-200">
                      {item.text}
                    </pre>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
};

export default OssLicenseDialog;
