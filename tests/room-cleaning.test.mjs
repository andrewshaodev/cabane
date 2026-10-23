import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";
import { withStorageDom } from "./dom-test-environment.mjs";

await withModules(async (load) => {
  const { RoomCleanAction } = await load(
    "/packages/engine/src/home-assistant-dashboard/RoomCleanAction.tsx",
  );
  const { HomeAssistantRuntimeValueProvider } = await load(
    "/packages/engine/src/HomeAssistantRuntimeContext.tsx",
  );
  const { mappedCleaningAreas, areaCleaningVacuums } = await load(
    "/packages/engine/src/home-assistant-dashboard/room-cleaning.ts",
  );
  const { applyDemoServiceCall } = await load(
    "/packages/engine/src/onboarding/demo/demo-device-state.ts",
  );
  const entity = (id) => ({
    entityId: id,
    available: true,
    stale: false,
    state: "docked",
    attributes: { supported_features: 16384 },
  });
  test("HA area mapping requires nonempty segment lists", () => {
    assert.deepEqual(
      mappedCleaningAreas({
        options: { vacuum: { area_mapping: { kitchen: ["1", "2"], empty: [], bad: [null] } } },
      }),
      ["kitchen"],
    );
    for (const value of [null, {}, { options: { vacuum: {} } }])
      assert.deepEqual(mappedCleaningAreas(value), []);
    assert.deepEqual(
      areaCleaningVacuums({
        entityRegistry: [{ entity_id: "vacuum.a", disabled_by: "user" }],
        entityStates: { "vacuum.a": entity("vacuum.a") },
      }),
      [],
    );
  });
  test("room cleaning resolves coverage, chooses one robot, guards requests and reports errors", async () => {
    await withStorageDom(async ({ document }) => {
      const root = createRoot(document.body.appendChild(document.createElement("div")));
      const calls = [];
      const reads = [];
      let finish;
      let runtime = {
        areas: [{ area_id: "kitchen" }, { area_id: "unmapped" }],
        status: "connected",
        canMutate: true,
        entityRegistry: [{ entity_id: "vacuum.a", area_id: "dock" }],
        entityStates: { "vacuum.a": entity("vacuum.a"), "vacuum.b": entity("vacuum.b") },
        sendStorageMessage: async (message) => {
          reads.push(message);
          return { options: { vacuum: { area_mapping: { kitchen: ["7"] } } } };
        },
        callService: (call) => {
          calls.push(call);
          return new Promise((resolve, reject) => {
            finish = { resolve, reject };
          });
        },
      };
      const render = async (areaId = "kitchen") =>
        act(async () =>
          root.render(
            React.createElement(
              HomeAssistantRuntimeValueProvider,
              { value: runtime },
              React.createElement(RoomCleanAction, { key: areaId, areaId }),
            ),
          ),
        );
      const clean = () => document.querySelector('[aria-label="Clean room"]');
      try {
        await render();
        assert.deepEqual(reads[0], { type: "config/entity_registry/get", entity_id: "vacuum.a" });
        await act(async () => {
          clean().click();
          clean().click();
        });
        assert.equal(calls.length, 1);
        assert.equal(clean().disabled, true);
        assert.deepEqual(calls[0], {
          domain: "vacuum",
          service: "clean_area",
          target: { entity_id: "vacuum.a" },
          data: { cleaning_area_id: ["kitchen"] },
        });
        assert.equal(applyDemoServiceCall(entity("vacuum.a"), calls[0]).state, "cleaning");
        await act(async () => finish.reject(new Error("HA rejected")));
        assert.match(document.querySelector('[role="alert"]').textContent, /failed/);
        await act(async () => clean().click());
        await act(async () => finish.resolve());
        assert.match(document.querySelector('[role="status"]').textContent, /requested/);
        runtime = { ...runtime, canMutate: false };
        await render();
        assert.equal(clean().disabled, true);
        runtime = {
          ...runtime,
          canMutate: true,
          entityStates: {
            ...runtime.entityStates,
            "vacuum.a": { ...entity("vacuum.a"), stale: true },
          },
        };
        await render();
        assert.equal(clean().disabled, true);
        await render("unmapped");
        assert.equal(clean(), null);
        runtime = {
          ...runtime,
          entityRegistry: [...runtime.entityRegistry, { entity_id: "vacuum.b" }],
        };
        await render();
        assert.equal(clean().disabled, true);
        const select = document.querySelector("select");
        await act(async () => {
          select.value = "vacuum.b";
          select.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
        });
        await act(async () => clean().click());
        assert.equal(calls.at(-1).target.entity_id, "vacuum.b");
        await act(async () => finish.resolve());
        runtime = {
          ...runtime,
          sendStorageMessage: async () => {
            throw new Error("read failed");
          },
        };
        await render();
        assert.equal(clean().disabled, true);
        assert.match(document.querySelector('[role="alert"]').textContent, /Could not read/);
      } finally {
        await act(async () => root.unmount());
      }
    });
  });
});
