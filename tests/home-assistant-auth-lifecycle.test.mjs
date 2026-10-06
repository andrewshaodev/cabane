import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { Auth } from "home-assistant-js-websocket";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const runtimeModule = await load("/packages/engine/src/HomeAssistantRuntime.tsx");
  const authModule = await load("/packages/engine/src/home-assistant-auth.ts");
  for (const scenario of ["disconnect", "unmount", "server change", "newer login", "refresh", "other tab", "late revoke", "strict callback", "same credential", "different server login", "queued logout", "pending newer login", "other tab refresh", "SDK refresh"]) {
    test(`fences delayed credentials: ${scenario}`, async () => {
      const dom = new JSDOM('<div id="root"></div>', { url: "https://dashboard.test/" });
      const previous = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT };
      Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
      const requests = [];
      let runtime;
      let root = createRoot(dom.window.document.getElementById("root"));
      const connection = { close() {}, addEventListener() {}, removeEventListener() {}, async sendMessagePromise() { return []; }, async subscribeEvents() { return () => {}; } };
      const client = {
        getAuth(options) { return new Promise((resolve) => requests.push({ options, resolve })); },
        async createConnection() { return connection; },
        subscribeEntities() { return () => {}; },
        async callService() { throw new Error("No services allowed"); },
      };
      function Probe() { runtime = runtimeModule.useHomeAssistantRuntime(); return React.createElement("span", null, runtime.status); }
      const render = async (url = "https://ha.test", strict = false) => act(async () => {
        const provider = React.createElement(runtimeModule.HomeAssistantRuntimeTestProvider, { homeAssistantUrl: url, client }, React.createElement(Probe));
        root.render(strict ? React.createElement(React.StrictMode, null, provider) : provider);
      });
      const finish = async (request, id) => {
        const auth = { data: { hassUrl: request.options.hassUrl, clientId: "https://dashboard.test", expires: Date.now() + 60000, expires_in: 60, refresh_token: `synthetic-refresh-${id}`, access_token: `synthetic-access-${id}` }, revoked: 0,
          async revoke() { this.revoked++; request.options.saveTokens(null); },
        };
        const sdkAuth = new Auth(auth.data, request.options.saveTokens);
        auth.refreshAccessToken = () => sdkAuth.refreshAccessToken();
        await act(async () => { request.options.saveTokens(auth.data); request.resolve(auth); });
        return auth;
      };
      const stored = () => dom.window.localStorage.getItem(authModule.homeAssistantAuthStorageKey(runtime.origin ?? "https://ha.test", "https://dashboard.test"));
      try {
        if (scenario === "strict callback") dom.window.history.replaceState(null, "", "/?auth_callback=1&code=synthetic&state=synthetic");
        await render("https://ha.test", scenario === "strict callback");
        if (scenario !== "strict callback") await act(async () => runtime.connect());
        const old = requests[0];
        if (scenario === "strict callback") {
          assert.equal(requests.length, 1);
          const auth = await finish(old, "strict");
          assert.equal(runtime.status, "connected");
          assert.equal(JSON.parse(stored()).refresh_token, auth.data.refresh_token);
          await act(async () => old.options.saveTokens({ ...auth.data, access_token: "synthetic-refreshed" }));
          assert.equal(JSON.parse(stored()).access_token, "synthetic-refreshed");
        } else if (scenario === "refresh" || scenario === "late revoke" || scenario === "other tab refresh" || scenario === "SDK refresh") {
          const auth = await finish(old, "old");
          let refreshPromise;
          let finishRefresh;
          if (scenario === "SDK refresh") {
            globalThis.fetch = (url) => {
              assert.equal(url, "https://ha.test/auth/token");
              return new Promise((resolve) => { finishRefresh = () => resolve({
                ok: true, json: async () => ({ access_token: "synthetic-sdk-refresh", expires_in: 60 }),
              }); });
            };
            refreshPromise = auth.refreshAccessToken();
          }
          let release;
          if (scenario === "late revoke") auth.revoke = () => new Promise((resolve) => { release = () => { old.options.saveTokens(null); resolve(); }; });
          let logout;
          if (scenario === "other tab refresh") {
            dom.window.localStorage.setItem(authModule.homeAssistantLogoutStorageKey("https://ha.test", "https://dashboard.test"), "synthetic-other-tab-logout");
            dom.window.localStorage.removeItem(authModule.homeAssistantAuthStorageKey(runtime.origin ?? "https://ha.test", "https://dashboard.test"));
            await act(async () => dom.window.dispatchEvent(new dom.window.StorageEvent("storage", {
              key: authModule.homeAssistantLogoutStorageKey("https://ha.test", "https://dashboard.test"), storageArea: dom.window.localStorage,
            })));
            assert.equal(runtime.status, "disconnected");
            assert.equal(auth.revoked, 1);
          } else await act(async () => { logout = runtime.disconnect(); });
          assert.equal(stored(), null, "logout clears storage before network revocation finishes");
          if (scenario === "late revoke") {
            await act(async () => runtime.connect());
            await finish(requests.at(-1), "new");
            await act(async () => { release(); await logout; });
            assert.equal(runtime.status, "connected");
            assert.equal(JSON.parse(stored()).refresh_token, "synthetic-refresh-new");
          } else if (scenario === "SDK refresh") {
            await act(async () => { finishRefresh(); await refreshPromise; });
            assert.equal(stored(), null, "the SDK's real deferred refresh must not persist after logout");
          } else {
            await act(async () => old.options.saveTokens({ ...auth.data, access_token: "synthetic-late-refresh" }));
            assert.equal(stored(), null);
          }
        } else {
          if (scenario === "unmount") { await act(async () => root.unmount()); root = null; }
          else if (scenario === "server change") await render("https://different-ha.test");
          else if (scenario === "other tab") {
            // Shared storage changes before the asynchronous storage event arrives.
            dom.window.localStorage.setItem(authModule.homeAssistantLogoutStorageKey("https://ha.test", "https://dashboard.test"), "synthetic-other-tab-logout");
          } else await act(async () => runtime.disconnect());
          const newerLogin = ["newer login", "same credential", "different server login", "queued logout"].includes(scenario);
          if (scenario === "different server login") await render("https://different-ha.test");
          if (newerLogin || scenario === "pending newer login") {
            await act(async () => runtime.connect());
            if (newerLogin) await finish(requests.at(-1), scenario === "same credential" ? "old" : "new");
          }
          const auth = await finish(old, "old");
          if (newerLogin) {
            assert.equal(JSON.parse(stored()).refresh_token, scenario === "same credential" ? "synthetic-refresh-old" : "synthetic-refresh-new");
            assert.equal(runtime.status, "connected");
          } else assert.equal(stored(), null);
          if (scenario === "same credential") assert.equal(auth.revoked, 0, "never revoke credentials adopted by a newer session");
          if (scenario === "queued logout") {
            await act(async () => dom.window.dispatchEvent(new dom.window.StorageEvent("storage", { key: authModule.homeAssistantLogoutStorageKey("https://ha.test", "https://dashboard.test"), storageArea: dom.window.localStorage })));
            assert.equal(runtime.status, "connected", "an old event must not cancel a post-logout login");
          }
          if (scenario === "pending newer login") {
            await act(async () => runtime.connect());
            assert.equal(requests.length, 2, "old finally must not unlock the pending newer attempt");
            await finish(requests[1], "new");
            assert.equal(runtime.status, "connected");
          }
          if (["disconnect", "newer login", "other tab", "different server login"].includes(scenario)) assert.equal(auth.revoked, 1);
          if (scenario === "other tab") await act(async () => dom.window.dispatchEvent(new dom.window.StorageEvent("storage", { key: authModule.homeAssistantLogoutStorageKey("https://ha.test", "https://dashboard.test"), newValue: "synthetic-other-tab-logout", storageArea: dom.window.localStorage })));
          if (scenario === "disconnect" || scenario === "other tab") {
            assert.equal(runtime.status, "disconnected");
            await act(async () => root.unmount());
            root = createRoot(dom.window.document.getElementById("root"));
            const count = requests.length;
            await render();
            assert.equal(requests.length, count, "reload must not resume cancelled authorization");
          }
        }
      } finally {
        if (root) await act(async () => root.unmount());
        dom.window.close();
        Object.assign(globalThis, previous);
      }
    });
  }
});
