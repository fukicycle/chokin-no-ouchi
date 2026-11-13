import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "@fukicycle/design/css/tokens.css";
import "@fukicycle/design/css/material.css";
import "@fukicycle/design/css/app.css";
import "./app/app.css";
import "./theme.css";
import "./screens.css";
import { router } from "./app/router";
import { syncThemeColor } from "./app/themeColor";
import { setupIosViewport } from "./app/iosViewport";
import { NotificationsProvider } from "./notifications/NotificationsProvider";
import { FeedbackProvider } from "./ui/Feedback";
import { UpdateProvider } from "./update/UpdateProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { PeriodProvider } from "./data/period";
import { HistoryFilterProvider } from "./screens/historyFilter";

syncThemeColor();
setupIosViewport();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UpdateProvider>
      <NotificationsProvider>
        <FeedbackProvider>
          <AuthProvider>
            <PeriodProvider>
              <HistoryFilterProvider>
                <RouterProvider router={router} />
              </HistoryFilterProvider>
            </PeriodProvider>
          </AuthProvider>
        </FeedbackProvider>
      </NotificationsProvider>
    </UpdateProvider>
  </StrictMode>,
);
