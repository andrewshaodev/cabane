import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { withModules } from "./test-server.mjs";
import { withStorageDom } from "./dom-test-environment.mjs";

await withModules(async load => {
  const { HomeAssistantHostSessionProvider } = await load("/packages/engine/src/index.ts");
  const { WorkspaceApplication } = await load("/apps/web/src/workspaces/WorkspaceApplication.tsx");
  const { initializeWorkspaces } = await load("/apps/web/src/workspaces/initialize-workspaces.ts");
  const { exportWorkspaceBackup } = await load("/apps/web/src/workspaces/workspace-transfer.ts");

  function startupTest(name, run) {
    test(name, async context => {
      // The HA client defers subscription teardown for several seconds. Keep
      // those grace timers off the wall clock and reset them after each case.
      context.mock.timers.enable({ apis: ["setTimeout"] });
      await run();
    });
  }

  async function mount(mode) {
    const { repository } = await initializeWorkspaces(indexedDB, window.localStorage, { skipLegacyMigration: true });
    const requests = [];
    let failList = mode === "error";
    let saved;
    if (["saved", "error", "local"].includes(mode)) {
      const entry = await repository.createBlank("Saved HA home");
      saved = { home_id: entry.metadata.id, name: "Saved HA home", version: 1,
        document: exportWorkspaceBackup({ ...entry.metadata, homeAssistantUrl: window.location.origin }, entry.record) };
      if (mode !== "local") await repository.delete(entry.metadata.id, await repository.readRaw(entry.metadata.id));
      else window.localStorage.setItem("cabane:last-opened-workspace", entry.metadata.id);
    }
    if (mode === "dismissed") await repository.dismissOnboarding("welcome");
    const connection = {
      connected: mode !== "disconnected", haVersion: "2026.10.0", addEventListener() {}, removeEventListener() {},
      get auth() { throw Error("must not read auth"); }, close() { throw Error("must not close host"); },
      async sendMessagePromise(message) {
        requests.push(message.type);
        if (message.type === "cabane/workspaces/list") {
          if (mode === "timeout") return new Promise(() => {});
          if (failList) throw Error("Storage unavailable");
          return saved ? [saved] : [];
        }
        if (message.type === "cabane/workspaces/get") return saved;
        if (message.type.startsWith("config/")) return [];
        throw Error(`Unexpected request ${message.type}`);
      },
      async subscribeEvents() { return () => {}; },
      async subscribeMessage(callback) { queueMicrotask(() => callback({ a: {} })); return () => {}; },
    };
    // React development diagnostics enumerate props; keep the access trap for
    // application reads without making diagnostic serialization invoke it.
    Object.defineProperty(connection, "auth", { enumerable: false });
    window.open = () => { throw Error("must not start OAuth"); };
    // Real startup and navigation, stopping at the destination. Chrome tests
    // separately cover mounting the destination, rendering and page reloads.
    const router = createMemoryRouter([
      { path: "/", element: React.createElement(WorkspaceApplication) },
      { path: "*", element: React.createElement("div", null, "Destination") },
    ], { initialEntries: ["/"] });
    const app = React.createElement(RouterProvider, { router });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    root.render(React.createElement(React.StrictMode, null, mode === "standalone" ? app
      : React.createElement(HomeAssistantHostSessionProvider, { session: { connection, origin: window.location.origin } }, app)));
    return { repository, requests, router, retry: () => { failList = false; },
      unmount: () => { root.unmount(); router.dispose(); container.remove(); } };
  }

  for (const [mode, path] of [["empty", "/welcome"], ["standalone", "/welcome"], ["dismissed", "/demo"], ["local", "/workspaces/"]]) {
    startupTest(`native startup preserves the ${mode} destination`, () => withStorageDom(async dom => {
      const h = await dom.mount(mount, mode);
      await dom.until(() => h.router.state.location.pathname.startsWith(path));
      const count = h.requests.filter(type => type === "cabane/workspaces/list").length;
      assert.ok(mode === "empty" ? count > 0 : count === 0, mode);
      if (mode === "empty") assert.ok(h.requests.every(type => type === "cabane/workspaces/list"));
    }));
  }

  startupTest("native startup can build a new home or cancel and persist dismissal", async () => {
    await withStorageDom(async dom => {
      const h = await dom.mount(mount, "saved");
      await dom.click("Create a new home");
      await dom.until(() => h.router.state.location.pathname === "/build");
    });
    await withStorageDom(async dom => {
      const h = await dom.mount(mount, "saved");
      await dom.click("Cancel");
      await dom.until(() => h.router.state.location.pathname === "/workspaces");
      assert.equal((await h.repository.readOnboarding()).welcomeDismissed, true);
      await act(async () => h.router.navigate("/"));
      await dom.until(() => h.router.state.location.pathname === "/demo");
    });
  });

  startupTest("disconnected native startup never requests storage", () => withStorageDom(async dom => {
    const h = await dom.mount(mount, "disconnected");
    await dom.until(() => dom.document.body.textContent.includes("Home Assistant is disconnected. Reconnect and try again."));
    assert.deepEqual(h.requests, []);
  }));

  startupTest("native startup distinguishes a timed-out check from an empty home list", () => withStorageDom(async dom => {
    const timers = new Map();
    const setTimeout = dom.window.setTimeout.bind(dom.window);
    const clearTimeout = dom.window.clearTimeout.bind(dom.window);
    let id = -1;
    dom.window.setTimeout = (callback, ms, ...args) => {
      if (ms !== 10000) return setTimeout(callback, ms, ...args);
      timers.set(id, callback); return id--;
    };
    dom.window.clearTimeout = id => { timers.delete(id); clearTimeout(id); };
    await dom.mount(mount, "timeout");
    await dom.until(() => timers.size > 0);
    assert.match(dom.document.body.textContent, /Checking for homes saved on Home Assistant/);
    await act(async () => { for (const callback of timers.values()) callback(); });
    assert.match(dom.document.body.textContent, /Home Assistant took too long to check saved homes. Try again./);
  }));

  startupTest("native startup retries failed checks and can explore the demo", () => withStorageDom(async dom => {
    const h = await dom.mount(mount, "error");
    await dom.until(() => dom.document.body.textContent.includes("Storage unavailable"));
    assert.doesNotMatch(dom.document.body.textContent, /No Cabane workspaces saved on this HA instance/);
    h.retry();
    await dom.click("Try again");
    await dom.until(() => dom.document.body.textContent.includes("Saved HA home"));
    await dom.click("Explore the demo");
    await dom.until(() => h.router.state.location.pathname === "/demo");
  }));
});
