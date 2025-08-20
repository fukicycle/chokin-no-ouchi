/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
