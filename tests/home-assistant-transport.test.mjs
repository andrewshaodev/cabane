import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const runtime = await load("/packages/engine/src/HomeAssistantRuntime.tsx");
  const auth = await load("/packages/engine/src/home-assistant-auth.ts");
  const flow = await load("/packages/engine/src/HomeAssistantConnectionFlow.tsx");
  for (const [dashboard, ha, allowed] of [
    ["http://dashboard.test", "http://ha.test", false],
    ["http://dashboard.test", "https://ha.test", false],
    ["https://dashboard.test", "http://ha.test", false],
    ["https://dashboard.test", "https://ha.test", true],
    ["http://localhost:5173", "http://127.0.0.1:8123", true],
    ["http://127.0.0.1:5173", "http://[::1]:8123", true],
  ]) {
    for (const entry of ["sign-in", "callback", "restore"]) {
      test(`${entry}: ${dashboard} → ${ha}`, async () => {
        const dom = new JSDOM('<div id="root"></div>', {
          url: `${dashboard}/${entry === "callback" ? "?auth_callback=1&code=synthetic&state=synthetic" : ""}`,
        });
        const previous = Object.fromEntries(
          ["window", "document", "IS_REACT_ACT_ENVIRONMENT"].map((key) => [key, globalThis[key]]),
        );
        Object.assign(globalThis, {
          window: dom.window,
          document: dom.window.document,
          IS_REACT_ACT_ENVIRONMENT: true,
        });
        const root = createRoot(document.getElementById("root"));
        let value;
        let calls = 0;
        const client = {
          async getAuth() {
            calls++;
            throw new Error("Synthetic auth boundary reached");
          },
          async createConnection() {
            assert.fail("No real connection permitted");
          },
        };
        function Probe() {
          value = runtime.useHomeAssistantRuntime();
          return null;
        }
        try {
          if (entry === "restore")
            auth.saveStoredAuthData(
              window.localStorage,
              {
                hassUrl: ha,
                clientId: dashboard,
                expires: Date.now() + 60000,
                refresh_token: "synthetic",
                access_token: "synthetic",
                expires_in: 1800,
              },
              ha,
              dashboard,
            );
          assert.equal(flow.validateHomeAssistantUrlInput(ha).error === null, allowed);
          await act(async () =>
            root.render(
              React.createElement(
                runtime.HomeAssistantRuntimeTestProvider,
                { homeAssistantUrl: ha, client },
                React.createElement(Probe),
              ),
            ),
          );
          if (entry === "sign-in") await act(async () => value.connect());
          assert.equal(calls, allowed ? 1 : 0);
          if (!allowed) {
            assert.equal(value.status, "error");
            assert.match(value.error, /Open Cabane over HTTPS/);
            assert.equal(value.canMutate, false);
          }
          if (entry === "callback") assert.equal(window.location.search, "");
        } finally {
          await act(async () => root.unmount());
          dom.window.close();
          Object.assign(globalThis, previous);
        }
      });
    }
  }
});
