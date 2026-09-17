import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useSplashScreen } from "../hooks/useSplashScreen";
import Dashboard from "./Dashboard";
import LoginScreen from "./LoginScreen";

function App() {
  const { currentUser, authLoading } = useAuth();
  // 認証が確定するまでは index.html のスプラッシュが画面を覆っている。
  // splashFinished が true になったフレームでスプラッシュのフェードアウトと
  // 下の app-enter が同時に走り、ホーム画面へクロスフェードする。
  const splashFinished = useSplashScreen(!authLoading);

  return (
    <div className="App h-full">
      {splashFinished && (
        <div className="app-enter h-full">
          {currentUser ? <Dashboard /> : <LoginScreen />}
        </div>
      )}
    </div>
  );
}

export default App;
