const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
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

// 1. Firebase Admin SDK の初期化 (モジュラー形式)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://chokin-no-ouchi-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

const db = getDatabase();

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
    
    // セキュリティ＆プライバシー保護：ユーザー名やファミリーIDなどの個人特定情報をログに出さず、集計サマリーで出力します
    let totalUsers = userKeys.length;
    let unsubscribedCount = 0;
    let missingFamilyCount = 0;
    let registeredTodayCount = 0;
    let sendSuccessCount = 0;
    let sendFailCount = 0;
    let expiredSubscriptionsCount = 0;

    for (const uid of userKeys) {
      const user = users[uid];
      const subscription = user.pushSubscription;
      const familyId = user.familyId;

      if (!subscription) {
        unsubscribedCount++;
        continue;
      }

      if (!familyId) {
        missingFamilyCount++;
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
        registeredTodayCount++;
        continue;
      }

      // 今日未登録のユーザーへ Web Push 配信
      const payload = JSON.stringify({
        title: "貯金のおうち 🏠",
        body: "今日の支出は登録しましたか？おうちの家計簿を更新しましょう！",
        icon: "/chokin-no-ouchi/icon.svg"
      });

      try {
        await webpush.sendNotification(subscription, payload);
        sendSuccessCount++;
      } catch (pushError) {
        // 410 (Gone) や 404 などのエラーは、購読が失効していることを示すためDBからクリーンアップ
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          expiredSubscriptionsCount++;
          await db.ref(`users/${uid}/pushSubscription`).remove();
        } else {
          sendFailCount++;
          console.error(`- 通知送信エラー (匿名):`, pushError.message);
        }
      }
    }

    console.log("\n=== デイリーリマインダー通知処理の正常終了 ===");
    console.log(`- 全登録ユーザー: ${totalUsers}人`);
    console.log(`- 通知未設定スキップ: ${unsubscribedCount}人`);
    console.log(`- ファミリーID未設定スキップ: ${missingFamilyCount}人`);
    console.log(`- 本日登録済みファミリー（通知スキップ）: ${registeredTodayCount}人`);
    console.log(`- リマインダー通知送信 成功: ${sendSuccessCount}人`);
    if (sendFailCount > 0) {
      console.log(`- リマインダー通知送信 失敗: ${sendFailCount}人`);
    }
    if (expiredSubscriptionsCount > 0) {
      console.log(`- 失効したプッシュ登録の自動削除: ${expiredSubscriptionsCount}件`);
    }
    console.log("=========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("致命的なエラーが発生しました:", error);
    process.exit(1);
  }
};

sendReminders();
