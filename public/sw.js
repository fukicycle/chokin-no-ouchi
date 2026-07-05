const CACHE_NAME = "chokin-no-ouchi-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // PWA基準をクリアするためのシンプルなパススルー・フェッチ
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// 新設: プッシュ通知受信ハンドラー (Web Push API標準対応)
self.addEventListener("push", (event) => {
  let title = "貯金のおうち";
  let body = "今日の支出は登録しましたか？おうちの家計簿を更新しましょう！";
  let icon = "/chokin-no-ouchi/icon.svg";

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      icon = data.icon || icon;
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  const options = {
    body: body,
    icon: icon,
    badge: "/chokin-no-ouchi/icon.svg",
    vibrate: [100, 50, 100],
    data: {
      url: "/chokin-no-ouchi/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 新設: 通知クリックハンドラー (アプリを開いて前面に移動)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 既に開いているタブがあればフォーカス、なければ新規で開く
      for (const client of clientList) {
        if (client.url.includes("/chokin-no-ouchi/") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || "/chokin-no-ouchi/");
      }
    })
  );
});
