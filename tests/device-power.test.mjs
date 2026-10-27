import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { IDBFactory } from "fake-indexeddb";
import { withModules } from "./test-server.mjs";
import { withStorageDom } from "./dom-test-environment.mjs";
import { connectedRuntimeFixture } from "./fixtures/home-assistant.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { useHomeEditorController } = await load(
    "/apps/web/src/editor-workspace/useHomeEditorController.ts",
  );
  const api = await load("/packages/engine/src/index.ts");
  const power = await load("/packages/engine/src/device-power.ts");
  const { setDevicePowerDraft } = await load("/apps/web/src/editor-connect/device-power-draft.ts");
  const { DevicePowerSettings } = await load(
    "/apps/web/src/editor-connect/DevicePowerSettings.tsx",
  );
  const { DeviceMappingInspector } = await load(
    "/packages/engine/src/home-assistant-mapping/DeviceMappingInspector.tsx",
  );
  const { RoomModule } = await load("/packages/engine/src/home-assistant-dashboard/RoomModule.tsx");
  const { makeLegacyProject } = await load("/tests/fixtures/multiple-floors.ts");
  const { stableDeviceRegistry } = await load("/packages/catalog/src/device/index.ts");
  const primarySlot = {
    id: "coffee-switch",
    compatibleDomains: ["switch"],
    required: true,
    autoMap: "manual",
    deviceRole: "primary",
    presentation: { label: "Coffee maker", dashboardRole: "primary" },
  };
  const powerSlot = {
    id: "coffee-power",
    compatibleDomains: ["sensor"],
    compatibleDeviceClasses: ["power"],
    required: false,
    autoMap: "manual",
    deviceRole: "secondary",
    activityThresholdWatts: 5,
    presentation: { label: "Power", dashboardRole: "secondary" },
  };
  const state = (value = "0", unit = "W", patch = {}) => ({
    entityId: "sensor.fixture_power",
    state: value,
    attributes: { device_class: "power", unit_of_measurement: unit },
    available: true,
    stale: false,
    ...patch,
  });
  const primaryState = { ...state("on"), entityId: "switch.demo_coffee", attributes: {} };
  const fixture = () => {
    const project = api.parseHomeProjectSchema(makeLegacyProject()).project;
    const item = {
      id: "coffee",
      kind: "device",
      modelId: "coffee-maker",
      floorId: project.floors[0].id,
      placement: { kind: "absolute", at: [2, 2], elevationMeters: 0, rotationYRadians: 0 },
      size: stableDeviceRegistry["coffee-maker"].defaultSize,
      entitySlots: [structuredClone(primarySlot)],
    };
    project.sceneItems = [item];
    const runtime = connectedRuntimeFixture();
    runtime.entityRegistry.push({
      ...runtime.entityRegistry.find((entry) => entry.entity_id === "switch.demo_coffee"),
      entity_id: "sensor.fixture_power",
      name: "Coffee power",
      area_id: "outside",
    });
    runtime.entityStates["sensor.fixture_power"] = state("0.006", "kW");
    const profile = {
      ...api.createEmptyRuntimeBindingProfile(project.home.id),
      roomAreaIds: { "demo-room": "demo_room" },
      entityIdsBySlotId: { "coffee-switch": "switch.demo_coffee" },
    };
    const origin = runtime.origin;
    const bindings = {
      [origin]: {
        draft: profile,
        published: structuredClone(profile),
        manualRoomIds: [],
        manualSlotIds: ["coffee-switch"],
      },
    };
    return { project, item, runtime, origin, bindings };
  };

  test("power readings convert SI units and reject missing, stale, unavailable or non-power data", () => {
    for (const [value, unit, expected] of [
      ["5", "W", 5],
      ["0.006", "kW", 6],
      ["1", "MW", 1e6],
      ["5000", "mW", 5],
      ["5", "µW", 0.000005],
      ["0", "W", 0],
      ["-2", "W", -2],
    ]) {
      assert.ok(Math.abs(power.powerInWatts(state(value, unit)) - expected) < 1e-10);
    }
    for (const reading of [
      undefined,
      state(""),
      state(" "),
      state("unknown"),
      state("NaN"),
      state("Infinity"),
      state("6 W"),
      state("6", "Wh"),
      state("6", ""),
      state("6", "W", { stale: true }),
      state("6", "W", { available: false }),
      state("6", "W", { attributes: { device_class: "energy", unit_of_measurement: "W" } }),
    ]) {
      assert.equal(power.powerInWatts(reading), null);
    }
  });

  test("activity uses a strict watts threshold, preserves defaults and stops on sensor failures without disabling switch control", () => {
    const device = {
      slot: { entitySlots: [primarySlot, powerSlot] },
      entities: [{ slotId: powerSlot.id, state: state("6"), issues: [] }],
      issues: [],
    };
    assert.equal(power.deviceVisualStateWithPower(device, primaryState), "connected-active");
    for (const reading of [
      state("0"),
      state("5"),
      state("unavailable", "W", { available: false }),
      state("6", "W", { stale: true }),
      state("6", "Wh"),
      undefined,
    ]) {
      device.entities[0].state = reading;
      assert.equal(power.deviceVisualStateWithPower(device, primaryState), "connected-inactive");
    }
    device.entities[0].state = state("6");
    assert.equal(
      power.deviceVisualStateWithPower(device, { ...primaryState, state: "off" }),
      "connected-inactive",
    );
    assert.equal(
      power.deviceVisualStateWithPower(device, { ...primaryState, stale: true }),
      "disconnected",
    );
    device.entities[0].issues = [{ severity: "error" }];
    assert.equal(power.deviceVisualStateWithPower(device, primaryState), "connected-inactive");
    device.slot.entitySlots = [primarySlot, { ...powerSlot, activityThresholdWatts: undefined }];
    assert.equal(power.deviceVisualStateWithPower(device, primaryState), "connected-active");
    device.slot.entitySlots = [primarySlot];
    assert.equal(power.deviceVisualStateWithPower(device, primaryState), "connected-active");
  });

  test("power settings discover the switch's device sensors and stage sensor, threshold and clear edits together", async () => {
    await withStorageDom(async ({ document, window }) => {
      const f = fixture();
      let current = { project: f.project, bindings: f.bindings };
      const root = createRoot(document.body.appendChild(document.createElement("div")));
      function Harness() {
        const [snapshot, setSnapshot] = useState(current);
        current = snapshot;
        const item = snapshot.project.sceneItems[0];
        return h(DevicePowerSettings, {
          device: api.deviceSlotForItem(item, snapshot.project.floors[0]),
          profile: snapshot.bindings[f.origin].draft,
          runtime: f.runtime,
          disconnected: false,
          onChange: (slot, entityId) =>
            setSnapshot(setDevicePowerDraft(snapshot, f.origin, item.id, slot, entityId)),
        });
      }
      const select = async (label, value) =>
        act(async () => {
          const input = document.querySelector(`select[aria-label="${label}"]`);
          input.value = value;
          input.dispatchEvent(new window.Event("change", { bubbles: true }));
        });
      try {
        await act(async () => root.render(h(Harness)));
        assert.match(
          document.querySelector('optgroup[label="Same Home Assistant device"]').textContent,
          /Coffee power/,
        );
        await select("Power sensor", "sensor.fixture_power");
        const slot = current.project.sceneItems[0].entitySlots.find(power.isDevicePowerSlot);
        assert.equal(
          current.bindings[f.origin].draft.entityIdsBySlotId[slot.id],
          "sensor.fixture_power",
        );
        assert.equal(
          slot.activityThresholdWatts,
          undefined,
          "telemetry alone preserves switch-based activity",
        );
        await select("Animate using", "power");
        assert.equal(current.project.sceneItems[0].entitySlots[1].activityThresholdWatts, 5);
        for (let i = 0; i < 7; i++)
          await act(async () =>
            document.querySelector('[aria-label="Increase Animation threshold"]').click(),
          );
        assert.equal(current.project.sceneItems[0].entitySlots[1].activityThresholdWatts, 12);
        await select("Power sensor", "");
        assert.equal(current.bindings[f.origin].draft.entityIdsBySlotId[slot.id], undefined);
        assert.equal(
          current.project.sceneItems[0].entitySlots[1].activityThresholdWatts,
          12,
          "clearing a mapping retains the configuration",
        );
        await select("Animate using", "switch");
        assert.equal(
          current.project.sceneItems[0].entitySlots[1].activityThresholdWatts,
          undefined,
        );
        assert.deepEqual(current.bindings[f.origin].published, f.bindings[f.origin].published);
      } finally {
        await act(async () => root.unmount());
      }
    });
  });

  test("the editor controller retains power slots through projection, undo, redo and mode changes", async () => {
    await withStorageDom(async ({ document }) => {
      const f = fixture();
      const record = { ...api.createSeedProjectRecord(f.project), bindings: f.bindings };
      let controller;
      const lifecycle = {
        autosave: async (current, draft, _now, bindings) => ({
          status: "saved",
          record: { ...current, draft, bindings, revision: current.revision + 1 },
        }),
      };
      const runtime = {
        ...f.runtime,
        refreshing: false,
        refreshError: null,
        refresh: async () => {},
        callService: async () => {
          throw Error("No services");
        },
        connect() {},
        retry() {},
        cameraClient: null,
      };
      const options = {
        initialRecord: record,
        lifecycle,
        autosaveDelayMs: 0,
        initialRequest: {
          mode: "connect",
          view: "devices",
          roomId: "demo-room",
          relationshipId: "coffee",
        },
        homeAssistantUrl: f.origin,
        onClose() {},
      };
      function Harness() {
        controller = useHomeEditorController(options);
        return null;
      }
      const root = createRoot(document.body.appendChild(document.createElement("div")));
      try {
        await act(async () =>
          root.render(
            h(
              api.HomeAssistantRuntimeValueProvider,
              { value: runtime },
              h(api.FloorNavigationProvider, null, h(Harness)),
            ),
          ),
        );
        await act(async () =>
          controller.connect.configureDevicePower("coffee", powerSlot, "sensor.fixture_power"),
        );
        assert.equal(controller.snapshot.project.sceneItems[0].entitySlots.length, 2);
        assert.equal(controller.furnishingEditor.items[0].entitySlots.length, 2);
        await act(async () => controller.undoProject());
        assert.equal(controller.snapshot.project.sceneItems[0].entitySlots.length, 1);
        await act(async () => controller.redoProject());
        assert.equal(
          controller.snapshot.project.sceneItems[0].entitySlots[1].activityThresholdWatts,
          5,
        );
        await act(async () => controller.selectMode("furnish"));
        assert.equal(controller.furnishingEditor.items[0].entitySlots.length, 2);
        await act(async () => controller.selectMode("connect"));
        assert.equal(
          controller.connect.profile.entityIdsBySlotId[powerSlot.id],
          "sensor.fixture_power",
        );
        const saved = await act(async () => await controller.flush());
        assert.equal(saved.status, "saved");
        assert.equal(saved.record.draft.sceneItems[0].entitySlots[1].activityThresholdWatts, 5);
      } finally {
        await act(async () => root.unmount());
      }
    });
  });

  test("adding power keeps the existing primary entity picker and cross-area control mapping", () => {
    const f = fixture();
    const next = setDevicePowerDraft(f, f.origin, "coffee", powerSlot, "sensor.fixture_power");
    const manifest = api.composeHomeBindingManifest(next.project, {});
    const profile = next.bindings[f.origin].draft;
    f.runtime.entityRegistry.find((entry) => entry.entity_id === "switch.demo_coffee").area_id =
      "outside";
    const resolved = api.resolveHomeAssistantBindings(manifest, profile, f.runtime);
    const device = resolved.rooms["demo-room"].devices[0];
    assert.equal(device.entities.length, 2);
    assert.equal(
      device.issues.some((issue) => issue.code === "binding.area-mismatch"),
      false,
    );
    const relationship = api
      .groupRoomMappingRelationships(manifest, "demo-room")
      .flatMap((group) => group.relationships)
      .find((entry) => entry.id === "coffee");
    const html = renderToStaticMarkup(
      h(DeviceMappingInspector, {
        manifest,
        profile,
        relationship,
        room: manifest.floors[0].rooms[0],
        runtime: f.runtime,
        state: "open",
        disabled: false,
        onEntityIdsBySlotIdChange() {},
        onSelectionMade() {},
        onCollapse() {},
        onReopen() {},
      }),
    );
    assert.match(html, /Home Assistant entity for Coffee maker/);
    assert.doesNotMatch(html, /Home Assistant device for Coffee maker/);
    const missing = api.resolveHomeAssistantBindings(
      manifest,
      { ...profile, entityIdsBySlotId: { "coffee-switch": "switch.demo_coffee" } },
      f.runtime,
    );
    assert.equal(
      missing.rooms["demo-room"].devices[0].issues.some(
        (issue) => issue.code === "binding.slot-unmapped",
      ),
      false,
    );
  });

  test("live popover shows converted watts while switch commands still target the original switch", async () => {
    await withStorageDom(async ({ document }) => {
      const f = fixture();
      const next = setDevicePowerDraft(f, f.origin, "coffee", powerSlot, "sensor.fixture_power");
      const manifest = api.composeHomeBindingManifest(next.project, {});
      const device = api.resolveHomeAssistantBindings(
        manifest,
        next.bindings[f.origin].draft,
        f.runtime,
      ).rooms["demo-room"].devices[0];
      const module = {
        id: "coffee",
        label: "Coffee maker",
        entities: device.entities,
        issues: [],
        priority: "primary",
        sourceOrder: 0,
      };
      const root = createRoot(document.body.appendChild(document.createElement("div")));
      const calls = [];
      const render = () =>
        act(async () =>
          root.render(
            h(RoomModule, {
              module,
              canMutate: true,
              focused: true,
              onCallService: async (call) => calls.push(call),
            }),
          ),
        );
      try {
        await render();
        assert.match(document.querySelector("output").textContent, /6 W/);
        await act(async () => document.querySelector("button[aria-pressed]").click());
        assert.equal(calls[0].target.entity_id, "switch.demo_coffee");
        device.entities.find((entry) => entry.slotId === powerSlot.id).state = state("6", "Wh");
        await render();
        assert.equal(document.querySelector("output").textContent, "Power unavailable");
      } finally {
        await act(async () => root.unmount());
      }
    });
  });

  test("power configuration survives history, IndexedDB publication and export without leaking entity IDs", async () => {
    const f = fixture();
    const before = {
      project: f.project,
      bindings: f.bindings,
      references: { fixture: { retained: true } },
    };
    const otherOrigin = "https://other-fixture.invalid";
    before.bindings[otherOrigin] = structuredClone(f.bindings[f.origin]);
    const next = setDevicePowerDraft(before, f.origin, "coffee", powerSlot, "sensor.fixture_power");
    assert.equal(next.bindings[otherOrigin], before.bindings[otherOrigin]);
    assert.equal(next.references, before.references);
    const history = api.commitWorkspaceSnapshot(api.createWorkspaceHistory(before), next);
    assert.deepEqual(api.undoWorkspaceHistory(history).present, before);
    const registries = { deviceModels: stableDeviceRegistry, furnishingModels: {} };
    const repository = api.createHomeProjectRepository(
      api.createIndexedDbProjectRecordStore(new IDBFactory()),
      registries,
    );
    const initial = await repository.loadOrCreate(f.project);
    const saved = await api.autosaveHomeProjectDraft(
      repository,
      initial.record,
      next.project,
      undefined,
      next.bindings,
    );
    assert.equal(saved.status, "saved");
    const published = await api.publishHomeProject(repository, saved.record, {
      confirmWarnings: true,
    });
    assert.equal(published.status, "published", JSON.stringify(published));
    const reopened = await repository.load(f.project.home.id);
    assert.equal(reopened.published.sceneItems[0].entitySlots[1].activityThresholdWatts, 5);
    assert.equal(
      reopened.bindings[f.origin].published.entityIdsBySlotId[powerSlot.id],
      "sensor.fixture_power",
    );
    const portable = api.serializeHomeProject(reopened.published);
    assert.equal(api.parseHomeProjectSchema(JSON.parse(portable)).valid, true);
    assert.doesNotMatch(portable, /sensor.fixture_power|switch.demo_coffee|other-fixture/);
    for (const invalid of [-1, Infinity, "5"]) {
      const bad = structuredClone(next.project);
      bad.sceneItems[0].entitySlots[1].activityThresholdWatts = invalid;
      assert.equal(api.parseHomeProjectSchema(bad).valid, false);
    }
    const bad = structuredClone(next.project);
    bad.sceneItems[0].entitySlots[1].compatibleDeviceClasses = ["energy"];
    assert.equal(api.parseHomeProjectSchema(bad).valid, false);
  });
});
