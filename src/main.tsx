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
import { NotificationsProvider } from "./notifications/NotificationsProvider";
import { FeedbackProvider } from "./ui/Feedback";
import { UpdateProvider } from "./update/UpdateProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { RecordsViewProvider } from "./screens/recordsView";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UpdateProvider>
      <NotificationsProvider>
        <FeedbackProvider>
          <AuthProvider>
            <RecordsViewProvider>
              <RouterProvider router={router} />
            </RecordsViewProvider>
          </AuthProvider>
        </FeedbackProvider>
      </NotificationsProvider>
    </UpdateProvider>
  </StrictMode>,
);
