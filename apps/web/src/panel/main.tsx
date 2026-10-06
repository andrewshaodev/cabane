import { ApplicationErrorBoundary, ApplicationRouteError } from "../ApplicationErrorBoundary";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import {
  CabaneDomProvider,
  HomeAssistantHostSessionProvider,
  type HomeAssistantHostSession,
} from "@cabane/engine";
import "@cabane/engine/styles.css";
import "../app-shell.css";
import { WorkspaceApplication } from "../workspaces/WorkspaceApplication";
import { createCabanePanelElement } from "./panel-element";

const assetBaseUrl = new URL(/* @vite-ignore */ "./", import.meta.url).href;
if (!customElements.get("cabane-panel")) {
  customElements.define(
    "cabane-panel",
    createCabanePanelElement({
      assetBaseUrl,
      mount({ container, portalContainer, root: shadow, session }) {
        const root = createRoot(container);
        // '/' applies normal last-workspace restoration and validates its existence.
        const router = createMemoryRouter(
          [
            {
              path: "*",
              errorElement: <ApplicationRouteError />,
              element: <WorkspaceApplication />,
            },
          ],
          { initialEntries: ["/"] },
        );
        const environment = {
          root: shadow,
          container,
          portalContainer,
          eventTarget: shadow,
          assetBaseUrl,
        };
        const render = (current: HomeAssistantHostSession) =>
          root.render(
            <StrictMode>
              <ApplicationErrorBoundary>
                <CabaneDomProvider environment={environment}>
                  <HomeAssistantHostSessionProvider session={current}>
                    <RouterProvider router={router} />
                  </HomeAssistantHostSessionProvider>
                </CabaneDomProvider>
              </ApplicationErrorBoundary>
            </StrictMode>,
          );
        render(session);
        return {
          update: render,
          dispose() {
            root.unmount();
            router.dispose();
          },
        };
      },
    }),
  );
}
