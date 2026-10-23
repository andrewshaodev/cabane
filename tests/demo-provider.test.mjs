import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";
import { connectedManifestFixture } from "./fixtures/home-assistant.mjs";

await withModules(async (load) => {
  const { DemoHomeAssistantSession, deriveDemoSessionDefinition } = await load(
    "/packages/engine/src/DemoHomeAssistantSession.tsx",
  );
  const { useHomeAssistantRuntime, HomeAssistantRuntimeValueProvider } = await load(
    "/packages/engine/src/HomeAssistantRuntime.tsx",
  );
  const { PhysicalToggle } = await load(
    "/packages/engine/src/home-assistant-dashboard/light-fields.tsx",
  );
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");

  test("normal controls use isolated demo sessions, reject failures, and reset without touching real HA or storage", async () => {
    const dom = new JSDOM('<div id="root"></div>', { url: "http://demo.local" });
    const keys = ["window", "document", "navigator", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"];
    const before = Object.fromEntries(keys.map((key) => [key, globalThis[key]]));
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      navigator: dom.window.navigator,
      HTMLElement: dom.window.HTMLElement,
      IS_REACT_ACT_ENVIRONMENT: true,
    });
    const root = createRoot(dom.window.document.getElementById("root"));
    const manifest = connectedManifestFixture(neutralDemoManifest);
    const id = deriveDemoSessionDefinition(manifest).sampleEntityId;
    const runtimes = {};
    let realCalls = 0;
    let interactions = 0;
    const previousFetch = globalThis.fetch;
    let networkCalls = 0;
    globalThis.fetch = () => {
      networkCalls++;
      throw new Error("Demo attempted network access");
    };
    const originalSetItem = dom.window.Storage.prototype.setItem;
    let storageWrites = 0;
    dom.window.Storage.prototype.setItem = () => {
      storageWrites++;
      throw new Error("Demo attempted storage access");
    };
    function Probe({ name }) {
      const runtime = useHomeAssistantRuntime();
      runtimes[name] = runtime;
      const entity = runtime.entityStates[id];
      return entity
        ? React.createElement(PhysicalToggle, {
            binding: { state: entity, label: `${name} lamp` },
            enabled: true,
            tone: "light",
            onCallService: runtime.callService,
          })
        : null;
    }
    const render = (firstManifest = manifest, version = 0) =>
      React.createElement(
        HomeAssistantRuntimeValueProvider,
        {
          value: {
            callService: async () => {
              realCalls++;
            },
          },
        },
        ...["first", "second"].map((name) =>
          React.createElement(DemoHomeAssistantSession, {
            key: `${name}-${version}`,
            manifest: name === "first" ? firstManifest : manifest,
            onInteraction: () => {
              interactions++;
            },
            children: () => React.createElement(Probe, { name }),
          }),
        ),
      );
    try {
      await act(async () => root.render(render()));
      await act(async () =>
        dom.window.document.querySelector('[aria-label="Turn on first lamp"]').click(),
      );
      assert.equal(runtimes.first.entityStates[id].state, "on");
      assert.equal(runtimes.second.entityStates[id].state, "off");
      assert.equal(interactions, 1);
      await act(async () => {
        await Promise.all([
          runtimes.first.callService({
            domain: "light",
            service: "turn_off",
            target: { entity_id: id },
          }),
          runtimes.first.callService({
            domain: "light",
            service: "turn_on",
            data: { brightness_pct: 25 },
            target: { entity_id: id },
          }),
        ]);
      });
      assert.equal(runtimes.first.entityStates[id].state, "on");
      assert.equal(runtimes.first.entityStates[id].attributes.brightness, 64);
      await assert.rejects(
        runtimes.first.callService({
          domain: "light",
          service: "turn_on",
          target: { entity_id: "light.unknown" },
        }),
        /demo/i,
      );
      assert.equal(interactions, 3);
      const oldCall = runtimes.first.callService;
      const replacement = structuredClone(manifest);
      replacement.floors[0].rooms[0].devices = [];
      await act(async () => root.render(render(replacement)));
      assert.equal(runtimes.first.entityStates[id], undefined);
      await assert.rejects(
        oldCall({ domain: "light", service: "turn_on", target: { entity_id: id } }),
        /no longer active/,
      );
      await act(async () => root.render(render(manifest, 1)));
      assert.equal(runtimes.first.entityStates[id].state, "off");
      const vacuum = Object.values(runtimes.first.entityStates).find((state) =>
        state.entityId.startsWith("vacuum."),
      );
      assert.ok(vacuum);
      const readRegistry = runtimes.first.sendStorageMessage;
      const entry = await readRegistry({
        type: "config/entity_registry/get",
        entity_id: vacuum.entityId,
      });
      const areaId = runtimes.first.areas[0].area_id;
      assert.ok(entry.options.vacuum.area_mapping[areaId].length);
      await act(async () =>
        runtimes.first.callService({
          domain: "vacuum",
          service: "clean_area",
          target: { entity_id: vacuum.entityId },
          data: { cleaning_area_id: [areaId] },
        }),
      );
      assert.equal(runtimes.first.entityStates[vacuum.entityId].state, "cleaning");
      assert.equal(runtimes.second.entityStates[vacuum.entityId].state, "docked");
      assert.equal(runtimes.first.sendStorageMessage, readRegistry);
      const disposedCall = runtimes.first.callService;
      await act(async () => root.unmount());
      await assert.rejects(
        disposedCall({ domain: "light", service: "turn_on", target: { entity_id: id } }),
        /no longer active/,
      );
      assert.equal(realCalls, 0);
      assert.equal(networkCalls, 0);
      assert.equal(storageWrites, 0);
    } finally {
      await act(async () => root.unmount());
      globalThis.fetch = previousFetch;
      dom.window.Storage.prototype.setItem = originalSetItem;
      dom.window.close();
      Object.assign(globalThis, before);
    }
  });
});
