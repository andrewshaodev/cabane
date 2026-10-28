import assert from "node:assert/strict";
import test from "node:test";
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";
import { connectedRuntimeFixture, rawEntity, toSnapshots } from "./fixtures/home-assistant.mjs";

await withModules(async (load) => {
  const engine = await load("/packages/engine/src/index.ts");
  const { stableDeviceRegistry: devices } = await load("/packages/catalog/src/device/index.ts");
  const { stableFurnishingRegistry: furnishings } = await load(
    "/packages/catalog/src/furnishing/index.ts",
  );
  const { interactionFloor } = await load("/tests/fixtures/interaction-floor.ts");
  const { itemEntityReadings } = await load("/packages/engine/src/ItemEntityReadings.tsx");
  const { statesBySlotIdForRoom } = await load(
    "/packages/engine/src/architecture-scene/RoomFurnishings.tsx",
  );
  const { deriveRoomStatusMap } = await load("/packages/engine/src/room-status/model.ts");
  const { ItemEntitySlots } = await load(
    "/apps/web/src/editor-preview/furnish/ItemEntitySlots.tsx",
  );
  const { DeviceMappingInspector } = await load(
    "/packages/engine/src/home-assistant-mapping/DeviceMappingInspector.tsx",
  );
  const { furnishingEditorReducer, createFurnishingEditorState } = await load(
    "/apps/web/src/editor-preview/furnish/editor-state.ts",
  );
  const { duplicateSceneItem } = await load(
    "/apps/web/src/editor-preview/furnish/duplicate-item.ts",
  );
  const { workspaceSnapshotFromEditorState } = await load(
    "/apps/web/src/editor-preview/project-sync.ts",
  );
  const registries = { furnishingModels: furnishings, deviceModels: devices, openingModels: {} };
  const slot = (id, deviceClass = "temperature") => ({
    id,
    compatibleDomains: ["sensor"],
    compatibleDeviceClasses: [deviceClass],
    required: false,
    autoMap: "manual",
    deviceRole: "secondary",
    presentation: { label: id, dashboardRole: "secondary", showInScene: true },
  });
  const projectFixture = () => {
    const project = engine.createEmptyHomeProject("attachments", "Synthetic attachments");
    const floor = structuredClone(interactionFloor);
    floor.rooms = floor.rooms.map((room) => ({ ...room, devices: [], dashboardSlots: [] }));
    project.floors = [floor];
    const placement = { kind: "absolute", at: [3, 3], elevationMeters: 0, rotationYRadians: 0 };
    const modelId = Object.keys(furnishings)[0];
    project.sceneItems = [
      {
        id: "fridge",
        kind: "device",
        floorId: floor.id,
        modelId: "refrigerator",
        size: devices.refrigerator.defaultSize,
        placement,
        entitySlots: [
          {
            id: "fridge-control",
            compatibleDomains: ["sensor"],
            compatibleDeviceClasses: ["temperature"],
            required: true,
            deviceRole: "primary",
            autoMap: "manual",
            presentation: { label: "Fridge", dashboardRole: "primary" },
          },
          slot("fridge-temperature"),
          slot("freezer-temperature"),
          slot("fridge-power", "power"),
        ],
      },
      {
        id: "furniture",
        kind: "furnishing",
        floorId: floor.id,
        modelId,
        size: furnishings[modelId].defaultSize,
        placement,
        entitySlots: [slot("furniture-reading")],
      },
    ];
    return project;
  };
  const connectionFixture = () => {
    const project = projectFixture();
    const manifest = engine.composeHomeManifest(project, registries);
    const runtime = connectedRuntimeFixture();
    runtime.entityRegistry = [
      ["switch.fridge", "plug"],
      ["sensor.fridge", "thermometer"],
      ["sensor.freezer", "freezer-thermometer"],
      ["sensor.power", "plug"],
      ["sensor.furniture", null],
    ].map(([entity_id, device_id]) => ({
      entity_id,
      device_id,
      area_id: "outside",
      name: entity_id,
      original_name: null,
      disabled_by: null,
      hidden_by: null,
    }));
    runtime.devices = runtime.entityRegistry
      .filter((entry) => entry.device_id)
      .map((entry) => ({
        id: entry.device_id,
        area_id: "outside",
        name: entry.device_id,
        name_by_user: null,
        model: "Synthetic",
      }));
    runtime.entityStates = toSnapshots(
      Object.fromEntries(
        [
          rawEntity("switch.fridge", "on"),
          rawEntity("sensor.fridge", "4", {
            device_class: "temperature",
            unit_of_measurement: "°C",
          }),
          rawEntity("sensor.freezer", "-18", {
            device_class: "temperature",
            unit_of_measurement: "°C",
          }),
          rawEntity("sensor.power", "85", { device_class: "power", unit_of_measurement: "W" }),
          rawEntity("sensor.furniture", "20", {
            device_class: "temperature",
            unit_of_measurement: "°C",
          }),
        ].map((entity) => [entity.entity_id, entity]),
      ),
    );
    const profile = {
      ...engine.createEmptyRuntimeBindingProfile(project.home.id),
      roomAreaIds: { [manifest.floors[0].rooms[0].id]: "demo_room" },
      entityIdsBySlotId: {
        "fridge-control": "sensor.fridge",
        "fridge-temperature": "sensor.fridge",
        "freezer-temperature": "sensor.freezer",
        "fridge-power": "sensor.power",
        "furniture-reading": "sensor.furniture",
      },
    };
    return { project, manifest, runtime, profile };
  };
  test("sensor attachments validate and round-trip on furniture and devices without broadening primary controls", () => {
    const project = projectFixture();
    const result = engine.validateHomeProject(project, registries);
    assert.equal(result.valid, true, JSON.stringify(result.issues));
    const parsed = engine.parseHomeProject(engine.serializeHomeProject(project));
    assert.equal(parsed.valid, true, JSON.stringify(parsed.issues));
    assert.deepEqual(parsed.project.sceneItems, project.sceneItems);
    const manifest = engine.composeHomeManifest(project, registries);
    assert.equal(
      engine.collectBindingSlots(manifest).filter((entry) => entry.slotId === "furniture-reading")
        .length,
      1,
    );
    assert.equal(engine.validateHomeManifest(manifest, { deviceModels: devices }).canRender, true);
    for (const invalidSlot of [
      { ...slot("bad"), compatibleDomains: ["switch"] },
      { ...slot("bad"), deviceRole: "primary" },
      { ...slot("bad"), required: true },
    ]) {
      const invalid = structuredClone(project);
      invalid.sceneItems[1].entitySlots = [invalidSlot];
      assert.equal(engine.validateHomeProject(invalid, registries).valid, false);
    }
    const invalid = structuredClone(project);
    invalid.sceneItems[0].entitySlots[0].compatibleDomains = ["lock"];
    assert.equal(engine.validateHomeProject(invalid, registries).valid, false);
    invalid.sceneItems[0].entitySlots[0].compatibleDomains = ["sensor"];
    invalid.sceneItems[1].entitySlots[0].presentation.showInScene = "yes";
    assert.equal(engine.parseHomeProject(engine.serializeHomeProject(invalid)).valid, false);
  });
  test("independent cross-device readings resolve without becoming ambient room temperature or primary state", () => {
    const { manifest, profile, runtime } = connectionFixture();
    assert.equal(engine.validateRuntimeBindingProfile(profile, manifest, runtime).valid, true);
    const resolved = engine.resolveHomeAssistantBindings(manifest, profile, runtime, devices);
    assert.deepEqual(resolved.issues, []);
    const room = manifest.floors[0].rooms[0];
    assert.equal(
      resolved.rooms[room.id].devices[0].entities.find((entry) => entry.slotId === "fridge-control")
        .state.state,
      "4",
    );
    const summary = deriveRoomStatusMap(manifest, profile, resolved, runtime)[room.id];
    assert.deepEqual(
      summary.temperature,
      { value: "4", unit: "°C" },
      "the existing primary temperature stays unchanged",
    );
    runtime.entityStates["sensor.fridge"].available = false;
    const refreshed = engine.resolveHomeAssistantBindings(manifest, profile, runtime, devices);
    assert.equal(
      deriveRoomStatusMap(manifest, profile, refreshed, runtime)[room.id].temperature,
      undefined,
      "freezer and furniture attachments do not replace ambient readings",
    );
    runtime.entityStates["sensor.fridge"].available = true;
    const descriptor = engine
      .collectBindingSlots(manifest)
      .find((entry) => entry.slotId === "freezer-temperature");
    assert.ok(
      engine
        .bindingEntityCandidates({
          descriptor,
          roomId: room.id,
          profile,
          runtime,
          scope: "all-areas",
        })
        .some((candidate) => candidate.entityId === "sensor.freezer"),
    );
    const cleared = engine.applyDeviceMapping(profile, room.devices[0], null);
    assert.equal(cleared.entityIdsBySlotId["fridge-control"], undefined);
    assert.equal(cleared.entityIdsBySlotId["freezer-temperature"], "sensor.freezer");
    assert.equal(
      engine.mappedHomeAssistantDeviceId(profile, room.devices[0], runtime),
      "thermometer",
    );
  });
  test("furniture readings outside rooms remain connectable without an architectural or area mapping", () => {
    const { project, runtime, profile } = connectionFixture();
    project.sceneItems = [
      {
        ...project.sceneItems[1],
        placement: { kind: "absolute", at: [-2, -2], elevationMeters: 0, rotationYRadians: 0 },
      },
    ];
    const manifest = engine.composeHomeManifest(project, registries);
    const outside = engine
      .deviceMappingRooms(manifest)
      .find((room) => room.id.startsWith("outside-rooms:"));
    assert.ok(outside);
    assert.equal(
      manifest.floors[0].rooms.some((room) => room.id === outside.id),
      false,
    );
    const descriptor = engine
      .collectBindingSlots(manifest)
      .find((entry) => entry.slotId === "furniture-reading");
    const outsideProfile = {
      ...profile,
      roomAreaIds: {},
      entityIdsBySlotId: { "furniture-reading": "sensor.furniture" },
    };
    assert.equal(
      engine.validateRuntimeBindingProfile(outsideProfile, manifest, runtime).valid,
      true,
    );
    assert.ok(
      engine
        .bindingEntityCandidates({
          descriptor,
          roomId: outside.id,
          profile: outsideProfile,
          runtime,
        })
        .some((candidate) => candidate.entityId === "sensor.furniture"),
    );
    const resolved = engine.resolveHomeAssistantBindings(
      manifest,
      outsideProfile,
      runtime,
      devices,
    );
    assert.deepEqual(resolved.rooms[outside.id].issues, []);
    assert.equal(statesBySlotIdForRoom(outside.id, resolved)["furniture-reading"].state, "20");
  });
  test("map visibility is independent of dashboard visibility and does not reveal stale values", () => {
    const { project, runtime, profile } = connectionFixture();
    project.sceneItems[1].entitySlots[0].presentation.dashboardRole = "hidden";
    const manifest = engine.composeHomeManifest(project, registries);
    const resolved = engine.resolveHomeAssistantBindings(manifest, profile, runtime, devices);
    const states = statesBySlotIdForRoom(manifest.floors[0].rooms[0].id, resolved);
    assert.deepEqual(itemEntityReadings(project.sceneItems[1].entitySlots, states), [
      { id: "furniture-reading", label: "furniture-reading", value: "20 °C" },
    ]);
    const readings = project.sceneItems[0].entitySlots;
    assert.deepEqual(
      itemEntityReadings(readings, states).map((reading) => reading.value),
      ["4 °C", "-18 °C", "85 W"],
    );
    readings[1].presentation.showInScene = false;
    assert.equal(itemEntityReadings(readings, states).length, 2);
    const stale = {
      ...states,
      "freezer-temperature": { ...states["freezer-temperature"], stale: true },
      "fridge-power": { ...states["fridge-power"], available: false },
    };
    assert.deepEqual(
      itemEntityReadings(readings, stale).map((reading) => reading.value),
      ["Stale", "Unavailable"],
    );
  });
  test("TV switch alternatives preserve existing slots, dispatch switch commands, and do not override unrelated domains", () => {
    for (const modelId of ["television", "wall-television", "compact-wall-television"]) {
      const { project, profile, runtime } = connectionFixture();
      project.sceneItems = [
        {
          ...project.sceneItems[0],
          modelId,
          size: devices[modelId].defaultSize,
          entitySlots: [
            {
              ...project.sceneItems[0].entitySlots[0],
              compatibleDomains: ["media_player"],
              compatibleDeviceClasses: [],
            },
          ],
        },
      ];
      const manifest = engine.composeHomeManifest(project, registries);
      const descriptor = engine
        .collectBindingSlots(manifest)
        .find((entry) => entry.slotId === "fridge-control");
      assert.ok(
        engine
          .bindingEntityCandidates({
            descriptor,
            roomId: manifest.floors[0].rooms[0].id,
            profile: { ...profile, entityIdsBySlotId: {} },
            runtime,
            scope: "all-areas",
          })
          .some((candidate) => candidate.entityId === "switch.fridge"),
      );
      const tvProfile = { ...profile, entityIdsBySlotId: { "fridge-control": "switch.fridge" } };
      assert.equal(engine.validateRuntimeBindingProfile(tvProfile, manifest, runtime).valid, true);
      const resolved = engine.resolveHomeAssistantBindings(manifest, tvProfile, runtime, devices);
      assert.deepEqual(resolved.issues, []);
      const state = resolved.rooms[manifest.floors[0].rooms[0].id].devices[0].entities[0].state;
      assert.deepEqual(engine.toggleEntityCall(state), {
        domain: "switch",
        service: "turn_off",
        data: undefined,
        target: { entity_id: "switch.fridge" },
      });
      project.sceneItems[0].entitySlots[0].compatibleDomains = ["switch"];
      project.sceneItems[0].entitySlots[0].compatibleDeviceClasses = [];
      assert.equal(engine.validateHomeProject(project, registries).valid, true);
      assert.equal(
        engine.validateHomeManifest(engine.composeHomeManifest(project, registries), {
          deviceModels: devices,
        }).canRender,
        true,
      );
    }
    const { project, profile, runtime } = connectionFixture();
    project.sceneItems[0].modelId = "speaker";
    project.sceneItems[0].entitySlots = [
      {
        ...project.sceneItems[0].entitySlots[0],
        compatibleDomains: ["media_player"],
        compatibleDeviceClasses: [],
      },
    ];
    const manifest = engine.composeHomeManifest(project, registries);
    assert.equal(
      engine.validateRuntimeBindingProfile(
        { ...profile, entityIdsBySlotId: { "fridge-control": "switch.fridge" } },
        manifest,
        runtime,
      ).valid,
      false,
    );
  });
  test("attachment edits participate in undo, duplication identity, and mapping cleanup while published mappings remain intact", () => {
    const { project, profile, runtime } = connectionFixture();
    const original = project.sceneItems[1];
    const duplicate = duplicateSceneItem(
      original,
      project.sceneItems,
      project.floors[0],
      engine.collectProjectIds(project),
    );
    assert.notEqual(duplicate.entitySlots[0].id, original.entitySlots[0].id);
    let state = createFurnishingEditorState(project.sceneItems);
    state = furnishingEditorReducer(state, {
      type: "update-entity-slots",
      id: original.id,
      entitySlots: [],
    });
    assert.equal(state.items[1].entitySlots.length, 0);
    assert.equal(furnishingEditorReducer(state, { type: "undo" }).items[1].entitySlots.length, 1);
    const bindings = {
      [runtime.origin]: {
        draft: profile,
        published: profile,
        manualSlotIds: Object.keys(profile.entityIdsBySlotId),
        manualRoomIds: Object.keys(profile.roomAreaIds),
      },
    };
    const next = workspaceSnapshotFromEditorState(
      { project, bindings },
      project.floors[0],
      state.items,
      registries,
    );
    assert.equal(
      next.bindings[runtime.origin].draft.entityIdsBySlotId["furniture-reading"],
      undefined,
    );
    assert.equal(
      next.bindings[runtime.origin].published.entityIdsBySlotId["furniture-reading"],
      "sensor.furniture",
    );
    assert.equal(
      next.bindings[runtime.origin].draft.entityIdsBySlotId["freezer-temperature"],
      "sensor.freezer",
    );
    const record = engine.createSeedProjectRecord(project);
    record.bindings = bindings;
    const parsed = engine.parseHomeProjectRecord(
      engine.serializeHomeProjectRecord(record),
      registries,
    );
    assert.equal(parsed.valid, true, JSON.stringify(parsed.issues));
    assert.deepEqual(parsed.record.bindings, bindings);
  });

  async function withDom(callback) {
    const dom = new JSDOM('<!doctype html><div id="root"></div>', {
      url: "http://attachment.invalid/",
      pretendToBeVisual: true,
    });
    const keys = ["window", "document", "navigator", "HTMLElement"];
    const previous = Object.fromEntries(
      keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
    );
    for (const key of keys)
      Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
    const priorAct = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const root = createRoot(dom.window.document.getElementById("root"));
    try {
      await callback({ root, dom, document: dom.window.document });
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const key of keys) {
        if (previous[key]) Object.defineProperty(globalThis, key, previous[key]);
        else delete globalThis[key];
      }
      globalThis.IS_REACT_ACT_ENVIRONMENT = priorAct;
    }
  }
  test("attachment authoring works on HTTP without randomUUID and toggles only its map visibility", async (context) => {
    const source = globalThis.crypto;
    context.mock.getter(globalThis, "crypto", () => ({
      getRandomValues: source.getRandomValues.bind(source),
    }));
    await withDom(async ({ root, document }) => {
      let current;
      function Harness() {
        const [item, setItem] = useState({ ...projectFixture().sceneItems[1], entitySlots: [] });
        current = item;
        return React.createElement(ItemEntitySlots, {
          item,
          label: "Cabinet",
          onChange: (entitySlots) => setItem({ ...item, entitySlots }),
        });
      }
      await act(async () => root.render(React.createElement(Harness)));
      await act(async () =>
        [...document.querySelectorAll("button")]
          .find((button) => button.textContent === "Add reading")
          .click(),
      );
      assert.equal(current.entitySlots.length, 1);
      assert.equal(current.entitySlots[0].presentation.label, "Cabinet temperature");
      assert.equal(engine.isAuxiliaryEntitySlot(current.entitySlots[0]), true);
      await act(async () => document.querySelector('input[type="checkbox"]').click());
      assert.equal(current.entitySlots[0].presentation.showInScene, false);
      assert.equal(current.entitySlots[0].presentation.dashboardRole, "secondary");
      await act(async () =>
        document.querySelector('button[aria-label="Remove Cabinet temperature"]').click(),
      );
      assert.equal(current.entitySlots.length, 0);
    });
  });
  test("Connect offers separate auxiliary entities across HA devices and retains the inspector after mapping", async () => {
    const { manifest, profile, runtime } = connectionFixture();
    const room = manifest.floors[0].rooms[0];
    const relationship = engine
      .groupRoomMappingRelationships(manifest, room.id)
      .flatMap((group) => group.relationships)
      .find((entry) => entry.id === "fridge");
    let next,
      closed = false;
    await withDom(async ({ root, document }) => {
      await act(async () =>
        root.render(
          React.createElement(DeviceMappingInspector, {
            manifest,
            room,
            relationship,
            profile,
            runtime,
            disabled: false,
            state: "open",
            inline: true,
            onEntityIdsBySlotIdChange: (value) => {
              next = value;
            },
            onSelectionMade: () => {
              closed = true;
            },
            onCollapse() {},
            onReopen() {},
          }),
        ),
      );
      const group = document.querySelector(
        '[aria-label="Home Assistant entity for freezer-temperature"]',
      );
      assert.ok(group, document.body.textContent);
      const freezer = [...group.querySelectorAll('input[type="radio"]')].find(
        (input) => input.value === "sensor.freezer",
      );
      assert.ok(freezer);
      const fridge = [...group.querySelectorAll('input[type="radio"]')].find(
        (input) => input.value === "sensor.fridge",
      );
      assert.match(
        fridge.closest("label").textContent,
        /already used/,
        "shared bindings retain the existing usage indication",
      );
      await act(async () =>
        [...group.querySelectorAll('input[type="radio"]')]
          .find((input) => input.value === "")
          .click(),
      );
      assert.equal(next["freezer-temperature"], undefined);
      assert.equal(next["fridge-control"], "sensor.fridge");
      assert.equal(next["fridge-power"], "sensor.power");
      assert.equal(closed, false);
    });
  });
});
