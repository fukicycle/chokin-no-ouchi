import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BASE = '/chokin-no-ouchi/'
const VERSION_FILE = 'version.json'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

/**
 * ビルドを一意に識別するID。
 * package.json の version を上げ忘れても「新しいビルドが出た」ことを
 * 検出できるよう、コミットハッシュ(無ければビルド時刻)を使う。
 */
function resolveBuildId() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return `dev-${Date.now().toString(36)}`
  }
}

const buildInfo = {
  version: pkg.version,
  buildTime: new Date().toISOString(),
  buildId: resolveBuildId(),
}

/**
 * 配信中のビルド情報を version.json として出力するプラグイン。
 * アプリはこれを no-store で取得し、自分に埋め込まれた buildInfo と
 * 突き合わせることで「更新があるか」をユーザー操作のタイミングで判定する。
 * 開発サーバーでも同じパスで取得できるようにしておく。
 */
function buildInfoPlugin() {
  const body = JSON.stringify(buildInfo, null, 2)
  return {
    name: 'chokin-build-info',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.split('?')[0].endsWith(`/${VERSION_FILE}`)) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(body)
          return
        }
        next()
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: VERSION_FILE, source: body })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), buildInfoPlugin()],
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(buildInfo.version),
    __APP_BUILD_TIME__: JSON.stringify(buildInfo.buildTime),
    __APP_BUILD_ID__: JSON.stringify(buildInfo.buildId),
  },
})
