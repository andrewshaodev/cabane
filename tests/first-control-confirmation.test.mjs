import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { confirmsFirstControl } = await load(
    "/packages/engine/src/onboarding/first-control-confirmation.ts",
  );
  const call = { domain: "light", service: "turn_on", target: { entity_id: "light.test" } };
  const before = {
    entityId: "light.test",
    state: "off",
    available: true,
    stale: false,
    attributes: {},
    lastUpdated: "1",
  };
  const after = { ...before, state: "on", lastUpdated: "2" };
  test("first-control success needs both a successful call and a newly confirmed matching state", () => {
    assert.equal(confirmsFirstControl(call, before, after, true), true);
    assert.equal(confirmsFirstControl(call, before, after, false), false);
    assert.equal(confirmsFirstControl(call, after, after, true), false);
    assert.equal(confirmsFirstControl(call, before, { ...after, stale: true }, true), false);
    assert.equal(confirmsFirstControl(call, before, { ...after, available: false }, true), false);
    assert.equal(confirmsFirstControl(call, before, { ...after, lastUpdated: "1" }, true), false);
    assert.equal(
      confirmsFirstControl(call, before, { ...after, entityId: "light.other" }, true),
      false,
    );
  });
  test("recognizes supported cover and climate targets without completing for unrelated changes", () => {
    for (const [domain, service, data, oldAttributes, newAttributes] of [
      [
        "cover",
        "set_cover_position",
        { position: 25 },
        { current_position: 0 },
        { current_position: 25 },
      ],
      ["climate", "set_temperature", { temperature: 22 }, { temperature: 20 }, { temperature: 22 }],
    ]) {
      const oldState = { ...before, entityId: `${domain}.test`, attributes: oldAttributes };
      const newState = { ...after, entityId: `${domain}.test`, attributes: newAttributes };
      const command = { domain, service, data, target: { entity_id: oldState.entityId } };
      assert.equal(confirmsFirstControl(command, oldState, newState, true), true);
      assert.equal(
        confirmsFirstControl(command, oldState, { ...newState, attributes: oldAttributes }, true),
        false,
      );
    }
  });
  const { useFirstControlConfirmation } = await load(
    "/packages/engine/src/onboarding/useFirstControlConfirmation.ts",
  );
  test("confirmation observes either event order, cancels on disconnect, and never duplicates commands", async () => {
    const dom = new JSDOM("<div id='root'></div>");
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
    const root = createRoot(dom.window.document.getElementById("root"));
    let observed,
      resolve,
      reject,
      calls = 0,
      confirmations = 0;
    const command = () => {
      calls++;
      return new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      });
    };
    const render = async (
      state,
      status = "connected",
      enabled = true,
      workspaceId = "home-a",
      targetEntityId = "light.test",
    ) => {
      const runtime = {
        entityStates: { "light.test": state },
        status,
        origin: "https://fixture.invalid",
        callService: command,
      };
      // A stable component retains the pending call across state events.
      await act(async () =>
        root.render(React.createElement(Probe, { runtime, enabled, workspaceId, targetEntityId })),
      );
    };
    function Probe({ runtime, enabled, workspaceId, targetEntityId }) {
      observed = useFirstControlConfirmation(
        runtime,
        enabled,
        () => confirmations++,
        workspaceId,
        targetEntityId,
      );
      return null;
    }
    try {
      await render(before);
      let result = observed.callService(call);
      await render(after);
      assert.equal(confirmations, 0);
      await act(async () => {
        resolve();
        await result;
      });
      assert.equal(confirmations, 1);
      await render(before);
      result = observed.callService(call);
      await act(async () => {
        resolve();
        await result;
      });
      assert.equal(confirmations, 1);
      await render(after);
      assert.equal(confirmations, 2);
      await render(before);
      result = observed.callService(call);
      await render(before, "disconnected");
      await act(async () => {
        resolve();
        await result;
      });
      await render(after);
      assert.equal(confirmations, 2);
      await render(before);
      result = observed.callService(call);
      const rejected = assert.rejects(result, /failed/);
      await render(after);
      await act(async () => {
        reject(new Error("failed"));
        await rejected;
      });
      assert.equal(confirmations, 2);
      await render(before);
      result = observed.callService(call);
      await render(after, "connected", true, "home-b");
      await act(async () => {
        resolve();
        await result;
      });
      assert.equal(confirmations, 2);
      await render(before, "connected", true, "home-b", "light.other");
      result = observed.callService(call);
      await render(after, "connected", true, "home-b", "light.other");
      await act(async () => {
        resolve();
        await result;
      });
      assert.equal(confirmations, 2);
      assert.equal(calls, 6);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, previous);
    }
  });
});
