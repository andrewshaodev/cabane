import { ApplicationErrorBoundary, ApplicationRouteError } from "./ApplicationErrorBoundary";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "@cabane/engine/styles.css";
import "./app-shell.css";
import { PublicSiteAnalytics } from "./public-site-analytics";
import { WorkspaceApplication } from "./workspaces/WorkspaceApplication";

const preventNativeZoom = (event: Event) => event.preventDefault();

window.addEventListener("wheel", (event) => {
  if (event.ctrlKey) event.preventDefault();
}, { passive: false });
window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key)) {
    event.preventDefault();
  }
});
document.addEventListener("gesturestart", preventNativeZoom, { passive: false });
document.addEventListener("gesturechange", preventNativeZoom, { passive: false });

const root = document.getElementById("root");
if (!root) throw new Error("The application root element is missing.");

const router = createBrowserRouter([{ path: "*", errorElement: <ApplicationRouteError />, element: <><PublicSiteAnalytics /><WorkspaceApplication /></> }]);

createRoot(root).render(
  <StrictMode>
    <ApplicationErrorBoundary><RouterProvider router={router} /></ApplicationErrorBoundary>
  </StrictMode>,
);
