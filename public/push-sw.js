// 入力忘れのお知らせ（Web Push）を受け取って表示する。
// vite-plugin-pwa が作る Service Worker から importScripts で読み込む（vite.config.ts）。
self.addEventListener("push", (event) => {
  let title = "貯金のおうち";
  let body = "今日の支出は記録しましたか？";
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
    } catch {
      body = event.data.text() || body;
    }
  }
  event.waitUntil(
    self.registration.showNotification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: "/" } }),
  );
});

// 通知を押したら、開いているアプリを前に出す（なければ開く）
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => new URL(c.url).origin === self.location.origin && "focus" in c);
      return open ? open.focus() : self.clients.openWindow(event.notification.data?.url || "/");
    }),
  );
});
