import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { useConnectSignIn } = await load("/apps/web/src/editor-connect/useConnectSignIn.ts");
  const { parseEditorReturn } = await load("/apps/web/src/editor-connect/connect-navigation.ts");
  const { ConnectSetup } = await load("/apps/web/src/editor-connect/ConnectSetup.tsx");
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
