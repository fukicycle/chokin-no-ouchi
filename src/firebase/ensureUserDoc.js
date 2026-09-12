import { ref, get, set } from "firebase/database";
import { database } from "./config";

// 初回サインイン時にユーザードキュメント（ファミリーID等）を作成する
export const ensureUserDoc = async (user) => {
  if (!user) return;

  const userRef = ref(database, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    const familyId = Math.random().toString(36).substring(2, 10).toUpperCase();
    await set(userRef, {
      email: user.email,
      displayName: user.displayName,
      familyId,
    });
  }
};
