/**
 * 実行中のビルドの識別情報。
 * 値は vite.config.js の define でビルド時に埋め込まれる。
 * 同じ内容が dist/version.json としても配信され、
 * useAppUpdate がこの2つを突き合わせて更新の有無を判定する。
 */
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_TIME = __APP_BUILD_TIME__;
export const APP_BUILD_ID = __APP_BUILD_ID__;

/** version.json の配信URL (base込み) */
export const VERSION_MANIFEST_URL = `${import.meta.env.BASE_URL}version.json`;

/** ISO文字列を「2026/09/14 21:30」形式にする。パースできなければ null */
export function formatBuildTime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
