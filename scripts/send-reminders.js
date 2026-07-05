const admin = require('firebase-admin');
const webpush = require('web-push');

// 鍵が環境変数に設定されているかチェック
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("エラー: FIREBASE_SERVICE_ACCOUNT が設定されていません。");
  process.exit(1);
}
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error("エラー: VAPID_PUBLIC_KEY または VAPID_PRIVATE_KEY が設定されていません。");
  process.exit(1);
}

// 1. Firebase Admin SDK の初期化
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://chokin-no-ouchi-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

const db = admin.database();

// 2. Web Push の VAPID 情報を設定
webpush.setVapidDetails(
  'mailto:lego.sato.4135@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 今日の日付 (日本時間 - JST) を取得するヘルパー
const getTodayJSTString = () => {
  const options = { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('ja-JP', options);
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`; // YYYY-MM-DD
};

const sendReminders = async () => {
  console.log("=== デイリーリマインダー通知処理の開始 ===");
  const todayJST = getTodayJSTString();
  console.log(`判定日 (JST): ${todayJST}`);

  try {
    // 全ユーザーを取得
    const usersSnapshot = await db.ref('users').once('value');
    const users = usersSnapshot.val() || {};

    const userKeys = Object.keys(users);
    console.log(`全登録ユーザー数: ${userKeys.length}人`);

    for (const uid of userKeys) {
      const user = users[uid];
      const subscription = user.pushSubscription;
      const familyId = user.familyId;

      if (!subscription) {
        console.log(`- ユーザー [${user.displayName || uid}] は通知を有効にしていません。スキップ。`);
        continue;
      }

      if (!familyId) {
        console.log(`- ユーザー [${user.displayName || uid}] はファミリーIDがありません。スキップ。`);
        continue;
      }

      // 【インテリジェント制御】今日すでに支出を登録したかチェック
      const expensesSnapshot = await db.ref(`expenses/${familyId}`).once('value');
      const expenses = expensesSnapshot.val() || {};
      
      const hasRegisteredToday = Object.values(expenses).some(expense => {
        if (!expense.date) return false;
        // 日付のプレフィックス (YYYY-MM-DD) が今日と一致するか
        return expense.date.startsWith(todayJST);
      });

      if (hasRegisteredToday) {
        console.log(`- ファミリー [${familyId}] (ユーザー: ${user.displayName}) は今日すでに登録済みです。通知を自動スキップ。`);
        continue;
      }

      // 今日未登録のユーザーへ Web Push 配信
      console.log(`- ユーザー [${user.displayName}] へリマインダー通知を送信します...`);
      const payload = JSON.stringify({
        title: "貯金のおうち 🏠",
        body: "今日の支出は登録しましたか？おうちの家計簿を更新しましょう！",
        icon: "/chokin-no-ouchi/icon.svg"
      });

      try {
        await webpush.sendNotification(subscription, payload);
        console.log(`  => 送信成功!`);
      } catch (pushError) {
        // 410 (Gone) や 404 などのエラーは、購読が失効していることを示すためDBからクリーンアップ
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          console.warn(`  => 購読が失効しているため削除します (ステータス: ${pushError.statusCode})`);
          await db.ref(`users/${uid}/pushSubscription`).remove();
        } else {
          console.error(`  => 送信エラー:`, pushError.message);
        }
      }
    }

    console.log("=== デイリーリマインダー通知処理の正常終了 ===");
    process.exit(0);
  } catch (error) {
    console.error("致命的なエラーが発生しました:", error);
    process.exit(1);
  }
};

sendReminders();
