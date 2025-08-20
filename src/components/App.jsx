import React from "react";
import { useAuth } from "../hooks/useAuth";
import Dashboard from "./Dashboard";
import LoginScreen from "./LoginScreen";

function App() {
  const { currentUser } = useAuth();

  return (
    <div className="App">{currentUser ? <Dashboard /> : <LoginScreen />}</div>
  );
}

export default App;
