import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { create } from "@react-three/test-renderer";
import { BoxGeometry, Group, Mesh, MeshToonMaterial } from "three";
import { withModules } from "./test-server.mjs";
import { withStorageDom } from "./dom-test-environment.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const api = await load("/packages/engine/src/index.ts");
  const { makeThreeFloorProject } = await load("/tests/fixtures/multiple-floors.ts");
  const { createCatalogItem } = await load(
    "/apps/web/src/editor-preview/furnish/placement/item-creation.ts",
  );
  const { duplicateSceneItem } = await load(
    "/apps/web/src/editor-preview/furnish/duplicate-item.ts",
  );
  const { lightingError, renormalizeLighting } = await load(
    "/apps/web/src/model-lighting/lighting-layout.ts",
  );
  const descriptor = {
    label: "Cabinet",
    category: "Storage",
    defaultRoomType: "living-room",
    defaultSize: [1, 1, 1],
    bounds: { min: [-0.5, 0, -0.5], max: [0.5, 1, 0.5] },
    resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
    preferredPlacement: "absolute",
    outlineContact: false,
    complexity: { triangles: 12, visibleMeshes: 1 },
  };
  const native = {
    furnishingModels: { cabinet: { ...descriptor, component: () => null } },
    deviceModels: {
      tv: {
        ...descriptor,
        label: "TV",
        component: () => null,
        mountKind: "surface",
        supportedDomains: ["media_player"],
        interaction: { tapTolerancePixels: 8 },
      },
      lamp: {
        ...descriptor,
        label: "Lamp",
        component: () => null,
        mountKind: "surface",
        supportedDomains: ["light"],
        sceneLight: { position: [0, 0.8, 0], color: "#ffe3b4", maxIntensity: 2, distance: 5 },
        interaction: { tapTolerancePixels: 8 },
      },
    },
  };
  const light = {
    position: [-0.3, 0.7, 0],
    points: [[0.3, 0.7, 0]],
    color: "#ffc999",
    maxIntensity: 6,
    distance: 5,
  };
  const slot = (id, domain) => ({
    id,
    compatibleDomains: [domain],
    required: true,
    autoMap: "manual",
    deviceRole: "primary",
    presentation: { label: id, dashboardRole: "primary" },
  });
  const item = (id, modelId, kind = "furnishing") => ({
    id,
    modelId,
    kind,
    floorId: "ground",
    placement: { kind: "absolute", at: [2, 2], elevationMeters: 0, rotationYRadians: 0 },
    size: [1, 1, 1],
    ...(kind === "device"
      ? { entitySlots: [slot(`${id}-primary`, modelId === "tv" ? "media_player" : "light")] }
      : {}),
  });
  const fixture = () => {
    const project = {
      ...makeThreeFloorProject(),
      sceneItems: [
        item("cabinet-a", "cabinet"),
        { ...item("cabinet-b", "cabinet"), floorId: "first" },
        item("tv", "tv", "device"),
        item("lamp", "lamp", "device"),
      ],
    };
    const profile = {
      schemaVersion: 1,
      homeId: project.home.id,
      roomAreaIds: {},
      entityIdsBySlotId: {
        "tv-primary": "media_player.synthetic",
        "lamp-primary": "light.synthetic",
      },
    };
    return {
      project,
      bindings: Object.fromEntries(
        ["https://one.invalid", "https://two.invalid"].map((origin) => [
          origin,
          {
            draft: structuredClone(profile),
            published: structuredClone(profile),
            manualRoomIds: [],
            manualSlotIds: Object.keys(profile.entityIdsBySlotId),
          },
        ]),
      ),
    };
  };
  test("shared lighting settings retain all copies, device controls and per-copy connections", () => {
    const before = fixture();
    const next = api.editModelLighting(before, "cabinet", light, native);
    assert.equal(next.project.sceneItems[0].kind, "furnishing");
    assert.equal(next.project.sceneItems[1].kind, "furnishing");
    assert.deepEqual(
      next.project.sceneItems.map(({ lightSlotId, ...rest }) => rest),
      before.project.sceneItems,
    );
    const ids = next.project.sceneItems.slice(0, 2).map((item) => item.lightSlotId);
    assert.equal(new Set(ids).size, 2);
    assert.ok(ids.every(Boolean));
    assert.deepEqual(next.bindings, before.bindings);
    const tv = api.editModelLighting(next, "tv", light, native);
    assert.deepEqual(
      tv.project.sceneItems[2].entitySlots,
      before.project.sceneItems[2].entitySlots,
    );
    const manifest = api.composeHomeBindingManifest(tv.project, { ...native, openingModels: {} });
    const descriptors = api.collectBindingSlots(manifest);
    assert.ok(descriptors.some((slot) => slot.slotId === "tv-primary"));
    assert.equal(descriptors.filter((slot) => slot.slotId.endsWith("-entity")).length, 3);
    assert.ok(
      manifest.floors[0].rooms
        .flatMap((room) => room.devices)
        .some((device) => device.entitySlots[0].presentation.label === "TV lighting"),
    );
    const updated = api.editModelLighting(tv, "cabinet", { ...light, maxIntensity: 10 }, native);
    assert.deepEqual(updated.project.sceneItems, tv.project.sceneItems);
    const parsed = api.parseHomeProjectSchema(JSON.parse(JSON.stringify(updated.project)));
    assert.equal(parsed.valid, true, JSON.stringify(parsed.issues));
    assert.equal(api.validateHomeProject(updated.project, native).valid, true);
    assert.deepEqual(before.project.modelLights, undefined);
  });
  test("removing lighting clears only its draft mappings and undo restores settings and stable identities", () => {
    const enabled = api.editModelLighting(fixture(), "cabinet", light, native);
    const id = api.lightingEntitySlotId(enabled.project.sceneItems[0].lightSlotId);
    for (const state of Object.values(enabled.bindings)) {
      state.draft.entityIdsBySlotId[id] = "light.cabinet";
      state.published.entityIdsBySlotId[id] = "light.cabinet";
      state.manualSlotIds.push(id);
    }
    const history = api.createWorkspaceHistory(enabled);
    const removed = api.editModelLighting(enabled, "cabinet", null, native);
    assert.ok(
      removed.project.sceneItems.every((item) => item.modelId !== "cabinet" || !item.lightSlotId),
    );
    for (const state of Object.values(removed.bindings)) {
      assert.equal(state.draft.entityIdsBySlotId[id], undefined);
      assert.equal(state.published.entityIdsBySlotId[id], "light.cabinet");
      assert.equal(state.draft.entityIdsBySlotId["tv-primary"], "media_player.synthetic");
    }
    assert.deepEqual(
      api.undoWorkspaceHistory(api.commitWorkspaceSnapshot(history, removed)).present,
      enabled,
    );
    assert.deepEqual(
      api.editModelLighting(removed, "cabinet", undefined, native).project.modelLights,
      undefined,
    );
  });
  test("native default reset preserves an existing primary light and never mutates shared registries", () => {
    const before = fixture();
    const original = native.deviceModels.lamp;
    const next = api.editModelLighting(
      before,
      "lamp",
      { ...light, emissiveSurfaces: ["surface:0:0"] },
      native,
    );
    assert.deepEqual(next.project.sceneItems, before.project.sceneItems);
    const resolved = api.resolveProjectModels(next.project, native);
    assert.equal(resolved.deviceModels.lamp.sceneLights.length, 2);
    assert.equal(native.deviceModels.lamp, original);
    assert.equal(original.lighting, undefined);
    assert.equal(
      api.resolveDeviceModelDefinition("lamp", native.deviceModels, resolved.deviceModels)
        .component,
      original.component,
    );
    assert.equal(
      api.resolveDeviceModelDefinition("lamp", native.deviceModels, resolved.deviceModels)
        .sceneLights.length,
      2,
    );
    const reset = api.editModelLighting(next, "lamp", undefined, native);
    assert.equal(reset.project.modelLights, undefined);
    assert.deepEqual(api.projectModelLighting(reset.project, "lamp", native), original.sceneLight);
    assert.deepEqual(reset.bindings, before.bindings);
  });
  test("placement and duplication create fresh unmapped lighting identities, with all IDs reserved", () => {
    const configured = api.editModelLighting(fixture(), "cabinet", light, native);
    const definitions = api.resolveProjectModels(configured.project, native);
    const entry = {
      key: "furnishing:cabinet",
      modelId: "cabinet",
      kind: "furnishing",
      definition: definitions.furnishingModels.cabinet,
    };
    const added = createCatalogItem(
      entry,
      configured.project.sceneItems[0].placement,
      configured.project.sceneItems,
      api.collectProjectIds(configured.project),
      "ground",
    );
    assert.equal(added.kind, "furnishing");
    assert.ok(added.lightSlotId);
    const copied = duplicateSceneItem(
      configured.project.sceneItems[0],
      configured.project.sceneItems,
      undefined,
      api.collectProjectIds(configured.project),
    );
    assert.notEqual(copied.lightSlotId, configured.project.sceneItems[0].lightSlotId);
    const ids = api.collectProjectIds({
      ...configured.project,
      sceneItems: [...configured.project.sceneItems, added, copied],
    });
    assert.equal(ids.length, new Set(ids).size);
  });
  test("lighting fields round-trip through real storage; failed writes leave the preceding saved record intact", () =>
    withStorageDom(async (dom) => {
      const before = fixture();
      const repository = api.createWorkspaceRepository(dom.indexedDB, native);
      const entry = await repository.create(api.createSeedProjectRecord(before.project), {
        name: "Lighting fixture",
      });
      const records = api.createHomeProjectRepository(
        api.createIndexedDbProjectRecordStore(dom.indexedDB),
        native,
      );
      const lifecycle = api.createHomeProjectLifecycle(records, entry.record.draft);
      const next = api.editModelLighting(
        { project: entry.record.draft, bindings: entry.record.bindings },
        "cabinet",
        light,
        native,
      );
      const saved = await lifecycle.autosave(entry.record, next.project, undefined, next.bindings);
      assert.equal(saved.status, "saved", saved.error?.message);
      assert.deepEqual(
        (await repository.read(entry.record.homeId)).record.draft.modelLights,
        next.project.modelLights,
      );
      const failStore = {
        async read() {
          return saved.record;
        },
        async write() {
          throw new Error("Synthetic disk full");
        },
      };
      const failedLifecycle = api.createHomeProjectLifecycle(
        api.createHomeProjectRepository(failStore, native),
        saved.record.draft,
      );
      const modified = api.editModelLighting(
        next,
        "cabinet",
        { ...light, maxIntensity: 11 },
        native,
      );
      const failed = await failedLifecycle.autosave(
        saved.record,
        modified.project,
        undefined,
        modified.bindings,
      );
      assert.equal(failed.status, "storage-error");
      assert.deepEqual(
        (await repository.read(entry.record.homeId)).record.draft.modelLights,
        next.project.modelLights,
      );
    }));
  test("native furnishing sources follow independent state, rotated nonuniform copies and retained off emitters", async () => {
    let snapshot = api.editModelLighting(fixture(), "cabinet", light, native);
    const object = {
      ...snapshot.project.sceneItems[0],
      size: [2, 3, 4],
      placement: {
        kind: "absolute",
        at: [2, 2],
        elevationMeters: 1,
        rotationYRadians: Math.PI / 2,
      },
    };
    snapshot = { ...snapshot, project: { ...snapshot.project, sceneItems: [object] } };
    const manifest = api.composeHomeBindingManifest(snapshot.project, {
      ...native,
      openingModels: {},
    });
    const floor = manifest.floors[0];
    const device = floor.rooms
      .flatMap((room) => room.devices)
      .find((device) => device.id === object.lightSlotId);
    const state = {
      entityId: "light.synthetic",
      state: "on",
      attributes: { brightness: 128, rgb_color: [0, 0, 255] },
      available: true,
      stale: false,
    };
    const resolved = {
      rooms: Object.fromEntries(
        floor.rooms.map((room) => [
          room.id,
          {
            room,
            displayName: room.name,
            pictureUrl: null,
            sections: { primary: [], secondary: [], diagnostic: [] },
            devices: room.devices.map((slot) => ({
              slot,
              entities: [
                {
                  slotId: slot.entitySlots[0].id,
                  domain: "light",
                  entityId: "light.synthetic",
                  state,
                },
              ],
              issues: [],
            })),
            issues: [],
          },
        ]),
      ),
      openings: {},
      issues: [],
    };
    assert.ok(device);
    const render = (resolvedBindings = resolved) =>
      React.createElement(api.HomeAssistantSceneLighting, {
        floor,
        resolvedBindings,
        deviceModels: native.deviceModels,
        extensionDeviceModels: manifest.extensions.deviceModels,
        sceneItems: [
          object,
          {
            ...object,
            id: "other-floor-copy",
            floorId: "first",
            lightSlotId: "other-floor-light",
            lightState: "always-on",
          },
        ],
      });
    const scene = await create(render());
    try {
      const emitters = scene.scene.findAllByType("PointLight").map((node) => node.instance);
      assert.equal(emitters.length, 2);
      assert.ok(Math.abs(emitters[0].position.y - 3.1) < 1e-6);
      assert.ok(
        Math.abs(
          emitters[0].position.z -
            (api.resolveItemTransform(object.placement, floor).position[2] + 0.6),
        ) < 1e-6,
      );
      assert.equal(emitters[0].intensity, (3 * 128) / 255);
      const off = structuredClone(resolved);
      for (const room of Object.values(off.rooms))
        for (const device of room.devices) device.entities[0].state.state = "off";
      await scene.update(render(off));
      assert.equal(scene.scene.findAllByType("PointLight").length, 2);
      assert.ok(
        scene.scene.findAllByType("PointLight").every((node) => node.instance.intensity === 0),
      );
    } finally {
      await scene.unmount();
    }
  });
  test("native surface glow is isolated between copies and preview highlights preserve shared geometry/materials", () => {
    const original = new MeshToonMaterial({ color: "#aabbcc" });
    const geometry = new BoxGeometry();
    const first = new Group();
    const a = new Mesh(geometry, original);
    a.name = "Diffuser";
    first.add(a);
    const second = first.clone();
    const b = second.children[0];
    const outline = new Mesh(geometry, original);
    outline.userData.sceneOutline = true;
    a.add(outline);
    const options = api.modelLightingSurfaces(first);
    assert.equal(options.length, 1);
    assert.equal(options[0].label, "Diffuser");
    assert.equal(api.modelLightingSurfaceAt(first, a), options[0].id);
    const control = api.controlModelLightMaterials(first, { emissiveSurfaces: [options[0].id] });
    control.update(
      {
        entityId: "light.test",
        state: "on",
        attributes: { brightness: 128 },
        available: true,
        stale: false,
      },
      "#ff0000",
    );
    assert.notEqual(a.material, original);
    assert.equal(b.material, original);
    assert.equal(a.geometry, geometry);
    assert.equal(a.material.emissiveIntensity, 128 / 255);
    assert.equal(a.material.emissive.getHexString(), "ff0000");
    control.dispose();
    control.dispose();
    assert.equal(a.material, original);
    geometry.dispose();
    original.dispose();
  });
  test("glow-only mode, invalid fields, source budgets and normalization corrections are explicit", () => {
    assert.ok(
      api
        .importedLightSources({ ...light, illuminate: false })
        .every((source) => source.maxIntensity === 0),
    );
    for (const fields of [
      { emissiveSurfaces: ["invalid"] },
      { illuminate: "yes" },
      { color: "invalid" },
    ])
      assert.equal(
        api.parseHomeProjectSchema({
          ...fixture().project,
          modelLights: { cabinet: { ...light, ...fields } },
        }).valid,
        false,
      );
    assert.match(lightingError({ ...light, position: [NaN, 0, 0] }), /finite/);
    const many = api.editModelLighting(
      fixture(),
      "cabinet",
      { ...light, points: Array(7).fill([0, 1, 0]) },
      native,
    );
    const repeated = Array.from({ length: 5 }, (_, i) => ({
      ...many.project.sceneItems[0],
      id: `many-${i}`,
      lightSlotId: `many-light-${i}`,
    }));
    const project = { ...many.project, sceneItems: repeated };
    assert.ok(
      api
        .validateHomeProject(project, native)
        .issues.some(
          (issue) => issue.code === "project.light-budget" && issue.severity === "warning",
        ),
    );
    const previous = {
      rotation: [0, 0, 0],
      scale: 1,
      offset: [0, 0, 0],
      size: [1, 1, 1],
      bounds: { min: [0, 0, 0], max: [1, 1, 1] },
    };
    const corrected = renormalizeLighting(light, previous, {
      ...previous,
      scale: 2,
      rotation: [0, Math.PI / 2, 0],
      offset: [0, 1, 0],
    });
    assert.ok(Math.abs(corrected.position[1] - 2.4) < 1e-8);
    assert.ok(Math.abs(corrected.position[2] - 0.6) < 1e-8);
    assert.equal(corrected.distance, 10);
  });
});
