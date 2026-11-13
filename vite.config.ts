import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import appConfig from "./app.config.ts";
import { parseReleaseNotes, type VersionInfo } from "./src/lib/releaseNotes.ts";

const root = import.meta.dirname;
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const notes = parseReleaseNotes(readFileSync(join(root, "RELEASE_NOTES.md"), "utf8"));
const currentNote = notes.find((n) => n.version === pkg.version);
const today = new Date().toISOString().slice(0, 10);

/** この版の情報。version.json としても公開し、アプリは起動中にこれを見て新しい版を知る */
const versionInfo: VersionInfo = {
  version: pkg.version,
  date: currentNote?.date || today,
  notes: currentNote?.items ?? [],
};

/** 設定 ＞ ライセンス に出す、アプリに含まれるライブラリのライセンス文 */
function collectLicenses() {
  const names = [...Object.keys(pkg.dependencies ?? {}), "workbox-window"];
  return names.flatMap((name) => {
    const dir = join(root, "node_modules", name);
    const file = ["LICENSE", "LICENSE.md", "LICENSE.txt", "license"]
      .map((f) => join(dir, f))
      .find(existsSync);
    if (!file) return [];
    const meta = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    return [{ name, license: meta.license ?? "", text: readFileSync(file, "utf8").trim() }];
  });
}

function versionPlugin(): Plugin {
  const json = JSON.stringify(versionInfo, null, 2);
  return {
    name: "fukicycle-version",
    config() {
      if (!currentNote) {
        console.warn(`[version] RELEASE_NOTES.md に v${pkg.version} の項目がありません`);
      }
      return {
        define: {
          __APP_VERSION__: JSON.stringify(versionInfo.version),
          __APP_DATE__: JSON.stringify(versionInfo.date),
          __RELEASE_NOTES__: JSON.stringify(notes),
          __LICENSES__: JSON.stringify(collectLicenses()),
        },
      };
    },
    configureServer(server) {
      server.middlewares.use("/version.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        res.end(json);
      });
    },
    transformIndexHtml(html) {
      return html.replace(/<title>.*<\/title>/, `<title>${appConfig.name}</title>`);
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: json });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    versionPlugin(),
    VitePWA({
      // 新しい版は自動で切り替えない。ユーザーが［更新する］を押したときだけ切り替える
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icon.svg"],
      manifest: {
        name: appConfig.name,
        short_name: appConfig.shortName,
        description: appConfig.description,
        lang: "ja",
        display: "standalone",
        start_url: "/",
        theme_color: "#fcf6ee",
        background_color: "#fcf6ee",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      workbox: {
        // version.json はキャッシュしない（新しい版の確認に使うため）
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // 入力忘れのお知らせ（Web Push）を受け取る処理
        importScripts: ["push-sw.js"],
        navigateFallbackDenylist: [/^\/version\.json/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-css" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
