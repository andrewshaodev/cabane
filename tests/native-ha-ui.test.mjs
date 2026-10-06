import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { HomeAssistantConnectionFlow } = await load(
    "/packages/engine/src/HomeAssistantConnectionFlow.tsx",
  );
  const { HomeAssistantHostSessionProvider } = await load(
    "/packages/engine/src/HomeAssistantHostSession.tsx",
  );
  const { HomeAssistantPage } = await load("/apps/web/src/workspaces/HomeAssistantPage.tsx");
  const { HomeAssistantRuntimeValueProvider } = await load(
    "/packages/engine/src/HomeAssistantRuntimeContext.tsx",
  );
  const { MemoryRouter } = await import("react-router");
  const { WorkspaceTransferDialog } = await load(
    "/apps/web/src/workspaces/WorkspaceTransferDialog.tsx",
  );
  test("import source follows the panel memory router without changing the host URL", async () => {
    const dom = new JSDOM('<div id="root"></div>', {
      url: "https://host.test/cabane?auth_callback=host-owned",
    });
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      HTMLElement: globalThis.HTMLElement,
      IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    };
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      HTMLElement: dom.window.HTMLElement,
      IS_REACT_ACT_ENVIRONMENT: true,
    });
    const root = createRoot(document.getElementById("root"));
    try {
      await act(async () =>
        root.render(
          React.createElement(
            MemoryRouter,
            { initialEntries: ["/workspaces?import=home-assistant"] },
            React.createElement(WorkspaceTransferDialog, {
              mode: "import",
              busy: false,
              error: null,
              remoteImport: React.createElement("p", null, "Host workspace library"),
              onImport() {},
              onExport() {},
              onCancel() {},
            }),
          ),
        ),
      );
      assert.match(document.body.textContent, /Host workspace library/);
      await act(async () =>
        [...document.querySelectorAll("button")]
          .find((button) => button.textContent === "From file")
          .click(),
      );
      assert.doesNotMatch(document.body.textContent, /Host workspace library/);
      assert.equal(window.location.href, "https://host.test/cabane?auth_callback=host-owned");
      await act(async () =>
        [...document.querySelectorAll("button")]
          .find((button) => button.textContent === "From Home Assistant")
          .click(),
      );
      assert.match(document.body.textContent, /Host workspace library/);
      assert.equal(window.location.href, "https://host.test/cabane?auth_callback=host-owned");
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, previous);
    }
  });
  const { WorkspaceDestinations } = await load(
    "/apps/web/src/workspaces/WorkspaceDestinations.tsx",
  );
  test("native workspace destinations use the host panel instead of standalone URLs", async () => {
    const dom = new JSDOM('<div id="root"></div>', { url: "https://host.test/cabane" });
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    };
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      IS_REACT_ACT_ENVIRONMENT: true,
    });
    const root = createRoot(document.getElementById("root"));
    try {
      await act(async () =>
        root.render(
          React.createElement(
            HomeAssistantHostSessionProvider,
            { session: { origin: "https://host.test", connection: {} } },
            React.createElement(WorkspaceDestinations, {
              id: "home",
              origin: "https://host.test",
              intent: "dashboard",
              ready: true,
            }),
          ),
        ),
      );
      assert.match(document.body.textContent, /Home Assistant sidebar/);
      assert.equal(document.querySelector("input"), null);
      assert.doesNotMatch(document.body.textContent, /Webpage card/);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, previous);
    }
  });
  const { WorkspaceHaLibrary } = await load("/apps/web/src/workspaces/WorkspaceHaLibrary.tsx");
  test("native import lists workspaces from the host instead of a remembered standalone server", async () => {
    const dom = new JSDOM('<div id="root"></div>', { url: "https://host.test/cabane" });
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    };
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      IS_REACT_ACT_ENVIRONMENT: true,
    });
    window.sessionStorage.setItem("cabane:ha-library-origin", "https://other.test");
    const requests = [];
    let failRegistry = true;
    const connection = {
      connected: true,
      haVersion: "2026.10.0",
      addEventListener() {},
      removeEventListener() {},
      close() {
        assert.fail("Host connection closed");
      },
      async sendMessagePromise(message) {
        requests.push(message.type);
        if (failRegistry && message.type === "config/area_registry/list")
          throw new Error("Temporary registry failure");
        return message.type === "cabane/workspaces/list"
          ? [{ home_id: "saved", name: "Saved host home", version: 1 }]
          : [];
      },
      async subscribeEvents() {
        return () => {};
      },
      async subscribeMessage() {
        return () => {};
      },
    };
    const root = createRoot(document.getElementById("root"));
    try {
      await act(async () =>
        root.render(
          React.createElement(
            HomeAssistantHostSessionProvider,
            { session: { origin: "https://host.test", connection } },
            React.createElement(WorkspaceHaLibrary, {
              repository: {},
              onRestored: async () => {},
              initialOrigin: "https://other.test",
            }),
          ),
        ),
      );
      assert.match(document.body.textContent, /Temporary registry failure/);
      failRegistry = false;
      await act(async () =>
        [...document.querySelectorAll("button")]
          .find((button) => button.textContent === "Retry connection")
          .click(),
      );
      assert.match(document.body.textContent, /Saved host home/);
      assert.match(document.body.textContent, /https:\/\/host.test/);
      assert.equal(document.querySelector("input"), null);
      assert.ok(requests.includes("cabane/workspaces/list"));
      assert.equal(window.sessionStorage.getItem("cabane:ha-library-origin"), "https://other.test");
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, previous);
    }
  });
  const { useConnectSignIn } = await load("/apps/web/src/editor-connect/useConnectSignIn.ts");
  test("native same-origin connection errors expose a safe retry in settings and Connect", async () => {
    const dom = new JSDOM('<div id="root"></div>', { url: "https://host.test/cabane" });
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    };
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      IS_REACT_ACT_ENVIRONMENT: true,
    });
    const root = createRoot(document.getElementById("root"));
    let retries = 0,
      prepared = 0;
    const runtime = {
      origin: "https://host.test",
      status: "error",
      error: "Registry read failed",
      retry() {
        retries++;
      },
      connect() {
        assert.fail("Native retry started OAuth");
      },
    };
    function ConnectProbe() {
      const signIn = useConnectSignIn(runtime, async () => {
        prepared++;
      });
      return React.createElement(
        "button",
        { onClick: () => signIn("https://host.test") },
        "Retry Connect",
      );
    }
    try {
      await act(async () =>
        root.render(
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(
              HomeAssistantHostSessionProvider,
              { session: { origin: "https://host.test", connection: {} } },
              React.createElement(
                HomeAssistantRuntimeValueProvider,
                { value: runtime },
                React.createElement(HomeAssistantPage, {
                  record: { homeId: "home", draft: { home: { name: "Home" } } },
                  lifecycle: {},
                  origin: "https://host.test",
                  onChangeOrigin: async () => {},
                  onRecordChange() {},
                  isDemo: false,
                  onCreatePersonal() {},
                }),
                React.createElement(ConnectProbe),
              ),
            ),
          ),
        ),
      );
      const retry = [...document.querySelectorAll("button")].find(
        (button) => button.textContent === "Retry connection",
      );
      assert.ok(retry, "Settings offers a recovery action for a borrowed-session error");
      await act(async () => retry.click());
      assert.equal(retries, 1);
      await act(async () =>
        [...document.querySelectorAll("button")]
          .find((button) => button.textContent === "Retry Connect")
          .click(),
      );
      assert.equal(prepared, 1);
      assert.equal(retries, 2);
      assert.equal(window.sessionStorage.getItem("cabane:editor-return:v1"), null);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, previous);
    }
  });
  test("native settings detach a workspace, preserve host sign-in, and isolate demo settings", async () => {
    const dom = new JSDOM('<div id="root"></div>', {
      url: "https://host.test/cabane?auth_callback=1",
    });
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    };
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      IS_REACT_ACT_ENVIRONMENT: true,
    });
    const root = createRoot(document.getElementById("root"));
    const changes = [];
    let detachments = 0;
    let authCalls = 0;
    const props = {
      record: { homeId: "native-home", draft: { home: { name: "Native home" } } },
      lifecycle: {},
      origin: "https://host.test",
      onChangeOrigin: async (origin) => changes.push(origin),
      onRecordChange() {},
      isDemo: false,
      onCreatePersonal() {},
    };
    const render = async (overrides = {}) =>
      act(async () =>
        root.render(
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(
              HomeAssistantHostSessionProvider,
              { session: { origin: "https://host.test", connection: {} } },
              React.createElement(
                HomeAssistantRuntimeValueProvider,
                {
                  value: {
                    status: "connected",
                    connect: () => authCalls++,
                    disconnect: async () => {
                      detachments++;
                    },
                  },
                },
                React.createElement(HomeAssistantPage, { ...props, ...overrides }),
              ),
            ),
          ),
        ),
      );
    try {
      await render();
      assert.match(document.body.textContent, /Sign-in is managed by Home Assistant/);
      assert.doesNotMatch(document.body.textContent, /Change URL|Reconnect|CORS/);
      await act(async () =>
        [...document.querySelectorAll("button")]
          .find((button) => button.textContent === "Disconnect workspace")
          .click(),
      );
      assert.deepEqual(changes, [null]);
      assert.equal(detachments, 1);
      assert.equal(authCalls, 0);
      assert.equal(window.sessionStorage.getItem("cabane:editor-return:v1"), null);
      await render({ origin: "https://other.test" });
      assert.match(document.body.textContent, /different Home Assistant/);
      await act(async () =>
        [...document.querySelectorAll("button")]
          .find((button) => button.textContent === "Use this Home Assistant")
          .click(),
      );
      assert.deepEqual(changes, [null, "https://host.test"]);
      assert.equal(authCalls, 0);
      await render({ isDemo: true });
      assert.match(document.body.textContent, /demo uses simulated devices/);
      assert.doesNotMatch(
        document.body.textContent,
        /Use this Home Assistant|Disconnect workspace|Sign-in is managed/,
      );
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, previous);
    }
  });
  test("native connection explicitly selects the host without OAuth or remapping another instance", async () => {
    const dom = new JSDOM('<div id="root"></div>', { url: "https://host.test/cabane" });
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    };
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      IS_REACT_ACT_ENVIRONMENT: true,
    });
    const root = createRoot(document.getElementById("root"));
    const selected = [];
    let authCalls = 0;
    try {
      await act(async () =>
        root.render(
          React.createElement(
            HomeAssistantHostSessionProvider,
            { session: { origin: "https://host.test", connection: {} } },
            React.createElement(HomeAssistantConnectionFlow, {
              homeAssistantUrl: "https://other.test",
              runtime: {
                status: "disconnected",
                connect: () => authCalls++,
                retry: () => authCalls++,
              },
              onHomeAssistantUrlChange: (value) => selected.push(value),
              onClose() {},
              onDefer() {},
            }),
          ),
        ),
      );
      assert.deepEqual(selected, []);
      assert.match(document.body.textContent, /different Home Assistant/);
      assert.doesNotMatch(
        document.body.textContent,
        /CORS|Authorize this dashboard|Continue to Home Assistant/,
      );
      await act(async () =>
        [...document.querySelectorAll("button")]
          .find((button) => button.textContent === "Use this Home Assistant")
          .click(),
      );
      assert.deepEqual(selected, ["https://host.test"]);
      assert.equal(authCalls, 0);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, previous);
    }
  });
});
