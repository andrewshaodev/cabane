import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { useConnectSignIn } = await load("/apps/web/src/editor-connect/useConnectSignIn.ts");
  const { parseEditorReturn } = await load("/apps/web/src/editor-connect/connect-navigation.ts");
  const { ConnectSetup } = await load("/apps/web/src/editor-connect/ConnectSetup.tsx");
  const { HomeAssistantPage } = await load("/apps/web/src/workspaces/HomeAssistantPage.tsx");
  const { HomeAssistantRuntimeValueProvider } = await load("/packages/engine/src/HomeAssistantRuntime.tsx");
  const origin = "https://synthetic-ha.invalid:8123";
  const runtime = { status: "disconnected", origin: null, connect() {}, retry() {} };

  async function withDom(run) {
    const dom = new JSDOM('<div id="root"></div>', { url: "https://connect-auth.invalid/", pretendToBeVisual: true });
    const previous = Object.fromEntries(["window", "document", "navigator", "HTMLElement"].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
    for (const name of Object.keys(previous)) Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
    const root = createRoot(dom.window.document.getElementById("root"));
    try { await run(root, dom.window); }
    finally { await act(async () => root.unmount()); dom.window.close(); for (const [name, value] of Object.entries(previous)) {
      if (value) Object.defineProperty(globalThis, name, value); else delete globalThis[name];
    } }
  }

  test("sign-in waits for the prepared origin and uses explicit login after an auth failure", async () => {
    await withDom(async (root) => {
      const calls = []; let signIn;
      function Harness({ actualRuntime }) {
        signIn = useConnectSignIn(actualRuntime, async (url) => { calls.push(`saved:${url}`); }); return null;
      }
      const render = (actualRuntime) => act(async () => root.render(createElement(StrictMode, null, createElement(Harness, { actualRuntime }))));
      await render({ ...runtime, origin: "http://previous.invalid", connect: () => calls.push("wrong-login") });
      assert.deepEqual(calls, []);
      await act(async () => signIn(origin));
      assert.deepEqual(calls, [`saved:${origin}`]);
      await render({ ...runtime, origin, status: "error", connect: () => calls.push("login"), retry: () => calls.push("resume") });
      assert.deepEqual(calls, [`saved:${origin}`, "login"]);
      await render({ ...runtime, origin, status: "connected", connect: () => calls.push("duplicate") });
      assert.equal(calls.length, 2);
    });
  });

  test("failed draft preparation prevents authentication and duplicate submits share one preparation", async () => {
    await withDom(async (root) => {
      let signIn, release, attempts = 0, auth = 0;
      const actualRuntime = { ...runtime, origin, connect: () => auth++ };
      function Harness({ fail }) {
        signIn = useConnectSignIn(actualRuntime, async () => {
          attempts++;
          if (fail) throw new Error("Draft save failed");
          await new Promise((resolve) => { release = resolve; });
        }); return null;
      }
      await act(async () => root.render(createElement(Harness, { fail: true })));
      await act(async () => assert.rejects(signIn(origin), /Draft save failed/));
      assert.equal(auth, 0);
      await act(async () => root.render(createElement(Harness, { fail: false })));
      let first;
      await act(async () => { first = signIn(origin); await signIn(origin); });
      assert.equal(attempts, 2); assert.equal(auth, 0);
      await act(async () => { release(); await first; });
      assert.equal(auth, 1);
    });
  });

  test("setup validates the address in one form and retains the pending device context", async () => {
    await withDom(async (root, window) => {
      const calls = [];
      const render = (address, busy = false) => act(async () => root.render(createElement(ConnectSetup, {
        origin: address, runtime, busy, pendingDevice: "Synthetic lamp", onConnect: async (url) => calls.push(url),
      })));
      await render("not-an-origin");
      const submit = () => act(async () => window.document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
      await submit();
      assert.equal(calls.length, 0);
      assert.ok(window.document.querySelector('[role="alert"]'));
      assert.match(window.document.body.textContent, /return to Synthetic lamp/);
      assert.equal(window.document.querySelector('input[type="file"]'), null);
      await render(`${origin}/`);
      await submit();
      assert.deepEqual(calls, [origin]);
      await render(origin, true);
      await submit();
      assert.equal(calls.length, 1);
      assert.equal(window.document.querySelector('button[type="submit"]').disabled, true);
    });
  });

  for (const address of ["homeassistant.local", "http://homeassistant.local:8123"]) {
    test(`settings shows inline feedback when connecting to ${address}`, async () => {
      await withDom(async (root, window) => {
        const calls = [];
        await act(async () => root.render(createElement(MemoryRouter, null,
          createElement(HomeAssistantRuntimeValueProvider, { value: runtime },
            createElement(HomeAssistantPage, {
              record: { homeId: "fixture", draft: { home: { name: "Fixture" } } },
              origin: address, isDemo: false, onChangeOrigin: async url => calls.push(url),
            })))));
        await act(async () => [...window.document.querySelectorAll('button')].find(button => button.textContent === "Change URL").click());
        await act(async () => window.document.querySelector('button.ha-primary').click());
        const alert = window.document.querySelector('section[aria-labelledby="ha-connection-title"] [role="alert"]');
        assert.ok(alert, "Connect must show an explanation beside the address");
        assert.match(alert.textContent, /https:\/\/|HTTPS/);
        assert.equal(window.document.querySelector('#ha-address').getAttribute('aria-invalid'), "true");
        assert.equal(calls.length, 0);
      });
    });
  }

  test("settings shows preparation, local-host connection progress, success and failures", async () => {
    await withDom(async (root, window) => {
      let release;
      const localOrigin = "https://homeassistant.local:8123";
      const calls = [];
      const render = (status, error = null) => act(async () => root.render(createElement(MemoryRouter, null,
        createElement(HomeAssistantRuntimeValueProvider, { value: {
          ...runtime, origin: localOrigin, status, error, connect: () => calls.push("connect"),
        } }, createElement(HomeAssistantPage, {
          record: { homeId: "fixture", draft: { home: { name: "Fixture" } } },
          origin: localOrigin, isDemo: false,
          onChangeOrigin: url => { calls.push(url); return new Promise((resolve, reject) => { release = { resolve, reject }; }); },
        })))));
      await render("disconnected");
      const reconnect = () => [...window.document.querySelectorAll('button')].find(button => button.textContent === "Reconnect");
      await act(async () => reconnect().click());
      assert.match(window.document.body.textContent, /Preparing sign-in/);
      assert.deepEqual(calls, [localOrigin]);
      await act(async () => release.reject(new Error("Could not save connection settings.")));
      assert.match(window.document.querySelector('section [role="alert"]').textContent, /Could not save connection settings/);
      await act(async () => reconnect().click());
      await act(async () => release.resolve());
      assert.deepEqual(calls, [localOrigin, localOrigin, "connect"]);
      await render("authenticating");
      assert.match(window.document.querySelector('[role="status"]').textContent, /Connecting/);
      await render("connected");
      assert.equal(window.document.querySelector('[role="status"]').textContent, "Connected");
      await render("error", "Unable to connect to Home Assistant. Check the address and network.");
      assert.match(window.document.querySelector('section [role="alert"]').textContent, /Check the address and network/);
      assert.ok(reconnect());
    });
  });

  test("OAuth navigation keeps exact target and camera, drops unknown data and rejects missing or mismatched workspaces", () => {
    const camera = { view: "3d", position: [2, 3, 4], target: [1, 0, 1], zoom: 65 };
    const request = { workspaceId: "home-a", mode: "connect", view: "devices", roomId: "room", relationshipId: "lamp",
      arrange: { selectedItemId: "lamp", camera }, ignored: "extra" };
    assert.deepEqual(parseEditorReturn(JSON.stringify(request)), { workspaceId: "home-a", mode: "connect", view: "devices", roomId: "room", relationshipId: "lamp", arrange: { selectedItemId: "lamp", camera } });
    assert.equal(parseEditorReturn('{'), null);
    assert.equal(parseEditorReturn('null'), null);
    assert.equal(parseEditorReturn('{"mode":"connect"}'), null);
    assert.equal(parseEditorReturn(JSON.stringify(request), "home-b"), null);
    assert.equal(parseEditorReturn(JSON.stringify(request), "home-a").workspaceId, "home-a");
    assert.equal(parseEditorReturn(JSON.stringify({ ...request, arrange: { camera: { ...camera, zoom: -1 } } })).arrange.camera, undefined);
  });
});
