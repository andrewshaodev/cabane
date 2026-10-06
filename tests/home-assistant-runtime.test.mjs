import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { ERR_INVALID_AUTH } from "home-assistant-js-websocket";
import { withModules } from "./test-server.mjs";
import {
  fixtureAreas,
  fixtureDevices,
  fixtureEntityRegistry,
  fixtureRawStates,
} from "./fixtures/home-assistant.mjs";

await withModules(async (load) => {
  const runtimeModule = await load("/packages/engine/src/HomeAssistantRuntime.tsx");
  const authModule = await load("/packages/engine/src/home-assistant-auth.ts");

  test("runs user-initiated auth, reconnect, resume, expiry, service, and disconnect lifecycles", async () => {
    const dom = new JSDOM("<!doctype html><div id=\"root\"></div>", {
      url: "http://127.0.0.1:4173/",
    });
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      navigator: globalThis.navigator,
      history: globalThis.history,
      localStorage: globalThis.localStorage,
      HTMLElement: globalThis.HTMLElement,
      Event: globalThis.Event,
      actEnvironment: globalThis.IS_REACT_ACT_ENVIRONMENT,
    };
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      navigator: dom.window.navigator,
      history: dom.window.history,
      localStorage: dom.window.localStorage,
      HTMLElement: dom.window.HTMLElement,
      Event: dom.window.Event,
      IS_REACT_ACT_ENVIRONMENT: true,
    });

    const listeners = new Map();
    const registryRequests = [];
    const fakeConnection = {
      closeCalls: 0,
      addEventListener(type, callback) {
        const callbacks = listeners.get(type) ?? new Set();
        callbacks.add(callback);
        listeners.set(type, callbacks);
      },
      removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
      fire(type, data) {
        for (const callback of listeners.get(type) ?? []) callback(fakeConnection, data);
      },
      close() { this.closeCalls += 1; },
      async sendMessagePromise(message) {
        registryRequests.push(message.type);
        if (message.type === "config/area_registry/list") return structuredClone(fixtureAreas);
        if (message.type === "config/device_registry/list") return structuredClone(fixtureDevices);
        if (message.type === "config/entity_registry/list") return structuredClone(fixtureEntityRegistry);
        if (message.type === "camera/capabilities") return { frontend_stream_types: ["web_rtc"] };
        throw new Error(`Unexpected fixture command: ${message.type}`);
      },
      async subscribeMessage() { return () => undefined; },
      async subscribeEvents() { return () => { eventUnsubscribeCalls += 1; }; },
    };
    let authCalls = 0;
    let revokeCalls = 0;
    let entityUnsubscribeCalls = 0;
    let eventUnsubscribeCalls = 0;
    let failAuth = false;
    let delayedAuth = null;
    let connectionCalls = 0;
    let lastAuthOptions = null;
    const serviceCalls = [];
    const fakeAuth = {
      data: {
        hassUrl: "http://127.0.0.1:8123",
        clientId: "http://127.0.0.1:4173",
        expires: Date.now() + 60_000,
        refresh_token: "fixture-refresh",
        access_token: "fixture-access",
        expires_in: 1800,
      },
      async revoke() { revokeCalls += 1; },
    };
    const client = {
      async getAuth(options) {
        authCalls += 1;
        lastAuthOptions = options;
        if (delayedAuth) return delayedAuth;
        if (failAuth) throw ERR_INVALID_AUTH;
        return fakeAuth;
      },
      async createConnection() { connectionCalls += 1; return fakeConnection; },
      subscribeEntities(_connection, callback) {
        callback(structuredClone(fixtureRawStates));
        return () => { entityUnsubscribeCalls += 1; };
      },
      async callService(_connection, domain, service, data, target) {
        serviceCalls.push({ domain, service, data, target });
      },
    };

    let latestRuntime;
    function Probe() {
      const runtime = runtimeModule.useHomeAssistantRuntime();
      latestRuntime = runtime;
      const light = runtime.entityStates["light.demo_ceiling"];
      return React.createElement(
        "div",
        {
          id: "probe",
          "data-status": runtime.status,
          "data-stale": String(light?.stale ?? false),
          "data-state-count": String(Object.keys(runtime.entityStates).length),
          "data-refreshing": String(runtime.refreshing),
          "data-refresh-error": runtime.refreshError ?? "",
          "data-camera-client": String(Boolean(runtime.cameraClient)),
        },
        React.createElement("button", { id: "connect", onClick: runtime.connect }, "connect"),
        React.createElement("button", { id: "disconnect", onClick: () => void runtime.disconnect() }, "disconnect"),
        React.createElement("button", { id: "retry", onClick: runtime.retry }, "retry"),
        React.createElement("button", { id: "refresh", onClick: () => void runtime.refresh() }, "refresh"),
        React.createElement("button", {
          id: "service",
          onClick: () => void runtime.callService({
            domain: "light",
            service: "turn_off",
            target: { entity_id: "light.demo_ceiling" },
          }),
        }, "service"),
        React.createElement("button", {
          id: "camera",
          onClick: () => void runtime.cameraClient?.sendMessagePromise({
            type: "camera/capabilities",
            entity_id: "camera.fixture",
          }),
        }, "camera"),
      );
    }

    const container = dom.window.document.getElementById("root");
    const root = createRoot(container);
    const renderProvider = async (url, key) => {
      await act(async () => {
        root.render(React.createElement(
          React.StrictMode,
          null,
          React.createElement(
            runtimeModule.HomeAssistantRuntimeTestProvider,
            { homeAssistantUrl: url, client, key },
            React.createElement(Probe),
          ),
        ));
        await Promise.resolve();
        await Promise.resolve();
      });
    };
    const probe = () => dom.window.document.getElementById("probe");

    try {
      await renderProvider(null, "unconfigured");
      assert.equal(probe().dataset.status, "unconfigured");
      assert.equal(authCalls, 0, "unconfigured startup must not attempt OAuth");

      await renderProvider("http://127.0.0.1:8123", "configured");
      assert.equal(probe().dataset.status, "disconnected");
      assert.equal(authCalls, 0, "configured startup without tokens must not redirect");

      // Exercise Connect inside an HA iframe without navigating that frame.
      dom.reconfigure({ windowTop: {} });
      let popupClosed = false;
      dom.window.open = (href) => {
        const authorization = new URL(href);
        const popup = { closed: false, close: () => { popupClosed = true; } };
        queueMicrotask(() => dom.window.dispatchEvent(new dom.window.MessageEvent("message", {
          origin: dom.window.location.origin,
          source: popup,
          data: { type: "cabane:ha-authorization", code: "synthetic-popup-code",
            state: authorization.searchParams.get("state") },
        })));
        return popup;
      };
      await act(async () => {
        dom.window.document.getElementById("connect").click();
        await Promise.resolve();
        await Promise.resolve();
      });
      assert.equal(probe().dataset.status, "connected");
      assert.equal(probe().dataset.cameraClient, "true");
      assert.equal(authCalls, 1);
      assert.equal(lastAuthOptions.hassUrl, "http://127.0.0.1:8123");
      assert.equal(lastAuthOptions.clientId, "http://127.0.0.1:4173");
      assert.equal(new URL(lastAuthOptions.redirectUrl).origin, "http://127.0.0.1:4173");
      assert.equal(lastAuthOptions.limitHassInstance, true);
      assert.equal(lastAuthOptions.authCode, "synthetic-popup-code");
      assert.equal(popupClosed, true);
      dom.reconfigure({ windowTop: dom.window });

      registryRequests.length = 0;
      await act(async () => {
        dom.window.document.getElementById("camera").click();
        await Promise.resolve();
      });
      assert.deepEqual(registryRequests, ["camera/capabilities"]);

      registryRequests.length = 0;
      const serviceCountBeforeRefresh = serviceCalls.length;
      await act(async () => {
        dom.window.document.getElementById("refresh").click();
        await Promise.resolve();
        await Promise.resolve();
      });
      assert.deepEqual(registryRequests.sort(), [
        "config/area_registry/list",
        "config/device_registry/list",
        "config/entity_registry/list",
      ]);
      assert.equal(serviceCalls.length, serviceCountBeforeRefresh);
      assert.equal(probe().dataset.refreshing, "false");
      assert.equal(probe().dataset.refreshError, "");

      await act(async () => {
        dom.window.document.getElementById("service").click();
        await Promise.resolve();
      });
      assert.deepEqual(serviceCalls[0], {
        domain: "light",
        service: "turn_off",
        data: undefined,
        target: { entity_id: "light.demo_ceiling" },
      });

      await act(async () => { fakeConnection.fire("disconnected"); });
      assert.equal(probe().dataset.status, "reconnecting");
      assert.equal(probe().dataset.cameraClient, "false");
      assert.equal(probe().dataset.stale, "true");
      await act(async () => {
        fakeConnection.fire("ready");
        await Promise.resolve();
        await Promise.resolve();
      });
      assert.equal(probe().dataset.status, "connected");

      authModule.saveStoredAuthData(dom.window.localStorage, fakeAuth.data, fakeAuth.data.hassUrl, fakeAuth.data.clientId);
      await act(async () => { fakeConnection.fire("reconnect-error", new Error("Fixture reconnect stopped.")); });
      assert.equal(probe().dataset.status, "error");
      await act(async () => {
        dom.window.document.getElementById("retry").click();
        await Promise.resolve();
        await Promise.resolve();
      });
      assert.equal(probe().dataset.status, "connected", "fatal reconnect can be retried from stored authorization");

      await act(async () => {
        dom.window.document.getElementById("disconnect").click();
        await Promise.resolve();
        await Promise.resolve();
      });
      assert.equal(probe().dataset.status, "disconnected");
      assert.equal(revokeCalls, 1);
      assert.equal(probe().dataset.stateCount, "0");
      assert.ok(fakeConnection.closeCalls >= 1);
      assert.ok(entityUnsubscribeCalls >= 1);
      assert.ok(eventUnsubscribeCalls >= 3);
      assert.equal(dom.window.localStorage.getItem(authModule.homeAssistantAuthStorageKey(fakeAuth.data.hassUrl, fakeAuth.data.clientId)), null);

      authModule.saveStoredAuthData(dom.window.localStorage, fakeAuth.data, fakeAuth.data.hassUrl, fakeAuth.data.clientId);
      await renderProvider("http://127.0.0.1:8123", "resume");
      assert.equal(probe().dataset.status, "connected", "stored authorization resumes without a new click");

      const oldRuntime = latestRuntime;
      const oldCamera = oldRuntime.cameraClient;
      let finishRegistry;
      const originalSend = fakeConnection.sendMessagePromise;
      const registryResult = new Promise((resolve) => { finishRegistry = resolve; });
      fakeConnection.sendMessagePromise = () => registryResult;
      let pendingRefresh;
      await act(async () => { pendingRefresh = oldRuntime.refresh(); });
      await renderProvider("http://127.0.0.1:8124", "other-home");
      assert.equal(probe().dataset.stateCount, "0");
      assert.equal(probe().dataset.status, "disconnected");
      await assert.rejects(oldRuntime.callService({
        domain: "light", service: "turn_off", target: { entity_id: "light.demo_ceiling" },
      }), /no longer active/);
      await assert.rejects(oldCamera.sendMessagePromise({ type: "camera/capabilities" }), /not connected/);
      await act(async () => { finishRegistry([]); await pendingRefresh; });
      assert.equal(probe().dataset.stateCount, "0");
      fakeConnection.sendMessagePromise = originalSend;
      assert.equal(probe().dataset.refreshing, "false");
      await renderProvider("http://127.0.0.1:8123", "returned-home");
      assert.equal(probe().dataset.status, "connected", "A sign-in survives visiting B");

      let finishAuth;
      delayedAuth = new Promise((resolve) => { finishAuth = resolve; });
      await renderProvider("http://127.0.0.1:8125", "pending-home");
      await act(async () => { latestRuntime.connect(); });
      assert.equal(probe().dataset.status, "authenticating");
      const connectionsBeforeStaleAuth = connectionCalls;
      await renderProvider("http://127.0.0.1:8124", "after-pending-home");
      await act(async () => { finishAuth(fakeAuth); await delayedAuth; });
      assert.equal(connectionCalls, connectionsBeforeStaleAuth, "late auth cannot open a socket after leaving");
      assert.equal(probe().dataset.status, "disconnected");
      delayedAuth = null;

      failAuth = true;
      dom.window.localStorage.clear();
      dom.window.history.replaceState(null, "", "/?auth_callback=1&code=fixture-secret&state=fixture-state");
      const authCallsBeforeCallback = authCalls;
      await renderProvider("http://127.0.0.1:8123", "expired");
      assert.equal(probe().dataset.status, "auth-expired");
      assert.equal(authCalls, authCallsBeforeCallback + 1, "Strict Mode exchanges an OAuth callback only once");
      assert.equal(dom.window.location.search, "", "OAuth callback values are removed from browser history");
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, {
        window: previous.window,
        document: previous.document,
        navigator: previous.navigator,
        history: previous.history,
        localStorage: previous.localStorage,
        HTMLElement: previous.HTMLElement,
        Event: previous.Event,
        IS_REACT_ACT_ENVIRONMENT: previous.actEnvironment,
      });
    }
  });
});
