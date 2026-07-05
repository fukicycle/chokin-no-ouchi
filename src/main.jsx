import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App.jsx";
import { AuthProvider } from "./components/AuthProvider.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./styles/App.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);

// PWAサービスワーカーの登録
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/chokin-no-ouchi/sw.js")
      .then((reg) => console.log("Service Worker registered successfully:", reg))
      .catch((err) => console.error("Service Worker registration failed:", err));
  });
}
