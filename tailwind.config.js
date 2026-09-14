/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        // 画面の高さが足りない端末向け。ヘッダー/ボトムナビ/余白を詰めて、
        // 各タブのコンテンツに使える高さを稼ぐ。
        short: { raw: "(max-height: 620px)" },
        // 低いうえに横幅がある(=横向きスマホなど)。
        // ホームの合計金額と円グラフを横並びにして円グラフの高さを確保する。
        "wide-short": { raw: "(max-height: 620px) and (min-width: 560px)" },
        // さらに低い場合は凡例などの補助情報も落とす
        "very-short": { raw: "(max-height: 460px)" },
      },
      colors: {
        "bg-primary": "#e0f7fa", // 淡いシアン
        "bg-secondary": "#ffffff", // 背景用ホワイト
        "text-dark": "#212121", // 黒に近いグレー
        "accent-blue": "#00bcd4", // アクセントの青
        "accent-pink": "#f06292", // アクセントのピンク
        "translucent-light": "rgba(255, 255, 255, 0.6)", // 半透明の白
      },
    },
  },
  plugins: [],
};
