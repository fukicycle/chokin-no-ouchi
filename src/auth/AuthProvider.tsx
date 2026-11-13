// ログイン中のユーザーと、その人が属する家族（familyId）。
// 家計簿は家族単位で共有するので、データはすべて familyId の下にある。
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from "firebase/auth";
import { get, onValue, ref, set, update } from "firebase/database";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useLive } from "../data/useLive";
import { auth, database, googleProvider } from "../firebase/config";

type UserDoc = { displayName?: string | null; email?: string | null; familyId?: string };

type AuthState = {
  user: User | null;
  /** ログインの確定やユーザー情報の読み込みを待っている間 true */
  loading: boolean;
  familyId: string | null;
  displayName: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  joinFamily: (familyId: string) => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

/** 初めてログインした人には、新しい家族を作る */
async function ensureUserDoc(user: User) {
  const userRef = ref(database, `users/${user.uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) {
    await set(userRef, {
      email: user.email,
      displayName: user.displayName,
      familyId: Math.random().toString(36).substring(2, 10).toUpperCase(),
    });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthReady(true);
      }),
    [],
  );

  // ユーザー情報（家族 ID など）。ログインしていなければ読まない
  const { value: doc, loading: docLoading } = useLive<UserDoc | null>(
    user?.uid ?? null,
    (set) => onValue(ref(database, `users/${user?.uid}`), (s) => set(s.val())),
    null,
  );

  const signIn = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(result.user);
  }, []);

  const signOut = useCallback(() => fbSignOut(auth), []);

  const joinFamily = useCallback(
    async (familyId: string) => {
      if (!user) return;
      await update(ref(database, `users/${user.uid}`), { familyId });
    },
    [user],
  );

  return (
    <Ctx.Provider
      value={{
        user,
        loading: !authReady || docLoading,
        familyId: doc?.familyId ?? null,
        displayName: doc?.displayName || user?.displayName || "",
        signIn,
        signOut,
        joinFamily,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth は AuthProvider の中で使う");
  return ctx;
}
