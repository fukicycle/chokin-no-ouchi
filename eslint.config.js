import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    // ビルド設定ファイルはNode上で動く
    files: ['*.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Service Worker は window ではなく ServiceWorkerGlobalScope で動く
    files: ['public/sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['public/sw.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // vite.config.js の define でビルド時に埋め込まれる定数
        __APP_VERSION__: 'readonly',
        __APP_BUILD_TIME__: 'readonly',
        __APP_BUILD_ID__: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
