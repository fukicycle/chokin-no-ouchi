/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare const __APP_VERSION__: string;
declare const __APP_DATE__: string;
declare const __RELEASE_NOTES__: import("./lib/releaseNotes").ReleaseNote[];
declare const __LICENSES__: { name: string; license: string; text: string }[];
