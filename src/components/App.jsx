import React from "react";
import { useAuth } from "../hooks/useAuth";
import Dashboard from "./Dashboard";
import LoginScreen from "./LoginScreen";

function App() {
  const { currentUser, authError } = useAuth();

  return (
    <div className="App h-full">
      {currentUser ? <Dashboard /> : <LoginScreen authError={authError} />}
    </div>
  );
}

export default App;
