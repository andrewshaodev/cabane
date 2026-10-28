import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";
import { withStorageDom } from "./dom-test-environment.mjs";
import { testGlb } from "./fixtures/personal-glb.mjs";

await withModules(async (load) => {
  const api = await load("/packages/engine/src/index.ts");
  const { editCustomModel } = api;
  const { ModelImportDialog } = await load("/apps/web/src/custom-models/ModelImportDialog.tsx");
  const { CustomModelLibrary } = await load("/apps/web/src/custom-models/CustomModelLibrary.tsx");
  const { makeThreeFloorProject } = await load("/tests/fixtures/multiple-floors.ts");
  const bytes = testGlb();
  const asset = { bytes, byteLength: bytes.length, sha256: await api.modelAssetHash(bytes) };
  const decoded = await api.loadGlb(bytes);
  const native = { furnishingModels: {}, deviceModels: {} };
  const model = {
    id: "custom:11111111-2222-4333-8444-555555555555",
    name: "Fixture lamp",
    profile: "light",
    placement: "floor",
    asset: { sha256: asset.sha256, byteLength: asset.byteLength },
    normalization: api.normalizeGlb(decoded.root, "floor"),
    complexity: decoded.complexity,
    light: { position: [0, 0.3, 0], color: "#ffe3b4", maxIntensity: 2, distance: 5 },
  };
  const fixture = () => {
    const project = { ...makeThreeFloorProject(), customModels: [model] };
    project.sceneItems = project.floors.map((floor, i) => ({
      id: `copy-${i}`,
      floorId: floor.id,
      modelId: model.id,
      kind: "device",
      size: model.normalization.size.map((n) => n * (i + 1)),
      placement: { kind: "absolute", at: [2, 2], elevationMeters: 0, rotationYRadians: 0.4 },
      lightState: "always-on",
      entitySlots: [
        {
          id: `slot-${i}`,
          compatibleDomains: ["light"],
          required: true,
          autoMap: "manual",
          deviceRole: "primary",
          presentation: { label: "Fixture", dashboardRole: "primary" },
        },
      ],
    }));
    const profile = {
      schemaVersion: 1,
      homeId: project.home.id,
      roomAreaIds: Object.fromEntries(
        project.floors.flatMap((floor) =>
          floor.rooms.map((room) => [room.id, `fixture-${room.id}`]),
        ),
      ),
      entityIdsBySlotId: Object.fromEntries(
        project.sceneItems.map((item, i) => [`slot-${i}`, `light.fixture_${i}`]),
      ),
    };
    return {
      project,
      bindings: Object.fromEntries(
        ["https://fixture.invalid", "https://other.invalid"].map((origin) => [
          origin,
          {
            draft: structuredClone(profile),
            published: structuredClone(profile),
            manualRoomIds: [],
            manualSlotIds: ["slot-0", "slot-1", "slot-2"],
          },
        ]),
      ),
    };
  };

  test("light edits preserve identity, exact copy transforms/sizes and mappings on every floor", () => {
    const before = fixture();
    const secondary = {
      ...before.project.sceneItems[0].entitySlots[0],
      id: "secondary-control",
      deviceRole: "secondary",
    };
    before.project.sceneItems[0].entitySlots.push(secondary);
    for (const state of Object.values(before.bindings)) {
      state.draft.entityIdsBySlotId[secondary.id] = "light.secondary";
      state.published.entityIdsBySlotId[secondary.id] = "light.secondary";
      state.manualSlotIds.push(secondary.id);
    }
    const changed = {
      ...model,
      name: "Updated",
      light: { position: [0.1, 0.2, 0.3], color: "#abcdef", maxIntensity: 4, distance: 7 },
    };
    const next = editCustomModel(before, changed);
    assert.deepEqual(next.project.customModels, [changed]);
    assert.equal(next.project.customModels[0].asset, model.asset);
    assert.deepEqual(next.project.sceneItems, before.project.sceneItems);
    assert.equal(next.bindings, before.bindings);
    assert.deepEqual(before.project.customModels, [model]);
    const definition = api.resolveProjectModels(next.project, native).deviceModels[model.id];
    assert.deepEqual(definition.sceneLight, changed.light);
    assert.deepEqual(api.validateHomeProject(next.project, native).issues, []);
  });

  test("normalization corrections resize all copies by their own multiplier without remounting", () => {
    const before = fixture();
    before.project.sceneItems[1].placement = {
      kind: "wall",
      wallId: before.project.floors[1].walls[0].id,
      face: "right",
      offsetFromWallStartPlanUnits: 2,
      elevationMeters: 1.3,
      depthOffsetMeters: 0.02,
      rotationOffsetRadians: 0.2,
    };
    before.project.sceneItems[2].placement = {
      kind: "ceiling",
      roomId: before.project.floors[2].rooms[0].id,
      at: [2, 2],
      dropMeters: 0.2,
      rotationYRadians: 0.7,
    };
    const normalization = api.normalizeGlb(decoded.root, "ceiling", [0, Math.PI / 2, 0], 1.2);
    const next = editCustomModel(before, { ...model, placement: "ceiling", normalization });
    next.project.sceneItems.forEach((item, i) => {
      item.size.forEach((n, axis) =>
        assert.ok(Math.abs(n - normalization.size[axis] * (i + 1)) < 1e-10),
      );
      assert.deepEqual(item.placement, before.project.sceneItems[i].placement);
      assert.equal(item.floorId, before.project.sceneItems[i].floorId);
      assert.deepEqual(item.entitySlots, before.project.sceneItems[i].entitySlots);
    });
    const validation = api.validateHomeProject(next.project, native);
    assert.equal(validation.valid, true, JSON.stringify(validation.issues));
    assert.deepEqual(
      validation.issues.map(({ code, path, severity }) => ({ code, path, severity })),
      [
        {
          code: "project.item-elevation",
          path: "sceneItems[0].placement.elevationMeters",
          severity: "warning",
        },
      ],
    );
  });

  for (const profile of ["sensor", "furniture"])
    test(`changing Light to ${profile} clears only draft connections, with atomic history`, () => {
      const before = fixture();
      const { light: _light, ...base } = model;
      const next = editCustomModel(before, { ...base, profile });
      for (const state of Object.values(next.bindings)) {
        assert.deepEqual(state.draft.entityIdsBySlotId, {});
        assert.deepEqual(state.manualSlotIds, []);
        assert.deepEqual(state.published, Object.values(before.bindings)[0].published);
      }
      for (const item of next.project.sceneItems) {
        assert.equal(item.kind, profile === "furniture" ? "furnishing" : "device");
        assert.equal("lightState" in item, false);
        if (profile === "sensor") {
          assert.deepEqual(item.entitySlots[0].compatibleDomains, ["sensor"]);
          assert.ok(!item.entitySlots[0].id.startsWith("slot-"));
        } else assert.equal("entitySlots" in item, false);
      }
      assert.deepEqual(api.validateHomeProject(next.project, native).issues, []);
      const history = api.commitWorkspaceSnapshot(api.createWorkspaceHistory(before), next);
      const undo = api.undoWorkspaceHistory(history);
      assert.deepEqual(undo.present, before);
      assert.deepEqual(api.redoWorkspaceHistory(undo).present, next);
    });

  test("profile conversions retain independent readings and mappings while replacing only primary controls", () => {
    const before = fixture();
    const readings = before.project.sceneItems.map((item, index) => {
      const slot = {
        id: `reading-${index}`,
        compatibleDomains: ["sensor"],
        required: false,
        autoMap: "manual",
        deviceRole: "secondary",
        presentation: {
          label: `Temperature ${index}`,
          dashboardRole: "secondary",
          showInScene: true,
        },
      };
      item.entitySlots.push(slot);
      for (const state of Object.values(before.bindings)) {
        state.draft.entityIdsBySlotId[slot.id] = `sensor.fixture_${index}`;
        state.published.entityIdsBySlotId[slot.id] = `sensor.fixture_${index}`;
        state.manualSlotIds.push(slot.id);
      }
      return slot;
    });
    const { light: _light, ...base } = model;
    const furniture = editCustomModel(before, { ...base, profile: "furniture" });
    const sensor = editCustomModel(before, { ...base, profile: "sensor" });
    const deviceAgain = editCustomModel(furniture, model);
    for (const next of [furniture, sensor, deviceAgain]) {
      next.project.sceneItems.forEach((item, index) => {
        assert.deepEqual((item.entitySlots ?? []).filter(api.isAuxiliaryEntitySlot), [
          readings[index],
        ]);
      });
      for (const [origin, state] of Object.entries(next.bindings)) {
        assert.deepEqual(
          state.draft.entityIdsBySlotId,
          Object.fromEntries(readings.map((slot, index) => [slot.id, `sensor.fixture_${index}`])),
        );
        assert.deepEqual(
          state.manualSlotIds,
          readings.map((slot) => slot.id),
        );
        assert.deepEqual(state.published, before.bindings[origin].published);
      }
      assert.deepEqual(api.validateHomeProject(next.project, native).issues, []);
      const history = api.commitWorkspaceSnapshot(api.createWorkspaceHistory(before), next);
      assert.deepEqual(api.undoWorkspaceHistory(history).present, before);
      assert.deepEqual(api.redoWorkspaceHistory(api.undoWorkspaceHistory(history)).present, next);
    }
    const ids = deviceAgain.project.sceneItems.flatMap((item) =>
      item.entitySlots.map((slot) => slot.id),
    );
    assert.equal(new Set(ids).size, ids.length);
  });

  test("furniture to device gives each copy a unique unmapped primary slot and preserves other models", () => {
    const source = editCustomModel(
      fixture(),
      (({ light: _light, ...model }) => ({ ...model, profile: "furniture" }))(model),
    );
    const unrelated = {
      ...source.project.sceneItems[0],
      id: "other-copy",
      modelId: "missing-fixture",
    };
    source.project.sceneItems.push(unrelated);
    const next = editCustomModel(source, model);
    const slots = next.project.sceneItems.slice(0, 3).map((item) => item.entitySlots[0]);
    assert.equal(new Set(slots.map((slot) => slot.id)).size, 3);
    assert.ok(slots.every((slot) => slot.autoMap === "manual" && slot.deviceRole === "primary"));
    assert.equal(next.project.sceneItems.at(-1), unrelated);
    assert.throws(
      () =>
        editCustomModel(source, { ...model, asset: { ...model.asset, sha256: "a".repeat(64) } }),
      /cannot replace/,
    );
    assert.throws(
      () => editCustomModel(source, { ...model, id: "custom:missing" }),
      /no longer exists/,
    );
  });

  test("edited definitions and copies reload from real IndexedDB without duplicating GLB assets", () =>
    withStorageDom(async (dom) => {
      const before = fixture();
      await api.stageModelAssets([asset]);
      const repository = api.createWorkspaceRepository(dom.indexedDB, native);
      const seed = api.createSeedProjectRecord(before.project);
      seed.bindings = before.bindings;
      const entry = await repository.create(seed, {
        name: "Edit fixture",
      });
      const record = entry.record;
      const next = editCustomModel(
        { project: record.draft, bindings: record.bindings },
        {
          ...model,
          name: "Edited lamp",
          normalization: api.normalizeGlb(decoded.root, "floor", [0, 0, 0], 0.8),
        },
      );
      const records = api.createHomeProjectRepository(
        api.createIndexedDbProjectRecordStore(dom.indexedDB),
        native,
      );
      const lifecycle = api.createHomeProjectLifecycle(records, record.draft);
      const saved = await lifecycle.autosave(record, next.project, undefined, next.bindings);
      assert.equal(saved.status, "saved", saved.error?.message);
      assert.equal(saved.record.draft.customModels[0].id, model.id);
      const loaded = await repository.read(record.homeId);
      assert.deepEqual(
        loaded.record.draft.customModels,
        JSON.parse(JSON.stringify(next.project.customModels)),
      );
      assert.deepEqual(loaded.record.draft.sceneItems, next.project.sceneItems);
      const { light: _light, ...base } = saved.record.draft.customModels[0];
      const converted = editCustomModel(
        { project: saved.record.draft, bindings: saved.record.bindings },
        { ...base, profile: "sensor" },
      );
      const convertedSave = await lifecycle.autosave(
        saved.record,
        converted.project,
        undefined,
        converted.bindings,
      );
      assert.equal(convertedSave.status, "saved", convertedSave.error?.message);
      const convertedRecord = (await repository.read(record.homeId)).record;
      assert.equal(convertedRecord.draft.customModels[0].profile, "sensor");
      assert.equal(convertedRecord.published.customModels[0].profile, "light");
      for (const [origin, state] of Object.entries(convertedRecord.bindings)) {
        assert.deepEqual(state.draft.entityIdsBySlotId, {});
        assert.deepEqual(state.published, saved.record.bindings[origin].published);
      }
      assert.equal(
        (await api.createModelAssetRepository(dom.indexedDB).verify([model.asset])).length,
        1,
      );
    }));

  test("Edit and verified model packs produce identical atomic model updates", async (context) => {
    const { light: _light, ...base } = model;
    const furniture = { ...base, profile: "furniture" };
    const sensor = { ...base, profile: "sensor" };
    const normalization = api.normalizeGlb(decoded.root, "wall", [0, Math.PI / 2, 0], 1.2);
    const cases = [
      [model, sensor],
      [model, furniture],
      [model, { ...model, placement: "wall", normalization }],
      [furniture, { ...furniture, light: model.light }],
      [{ ...furniture, light: model.light }, furniture],
      [{ ...sensor, light: model.light }, model],
      [
        { ...furniture, light: model.light },
        { ...sensor, light: model.light },
      ],
    ];
    let serial = 0;
    context.mock.method(
      globalThis.crypto,
      "randomUUID",
      () => `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}`,
    );
    for (const [source, changed] of cases) {
      const before = editCustomModel(fixture(), source);
      for (const [index, item] of before.project.sceneItems.entries()) {
        const reading = {
          id: `reading-${index}`,
          compatibleDomains: ["sensor"],
          required: false,
          autoMap: "manual",
          deviceRole: "secondary",
          presentation: { label: "Temperature", dashboardRole: "secondary", showInScene: true },
        };
        item.entitySlots = [...(item.entitySlots ?? []), reading];
        for (const state of Object.values(before.bindings)) {
          state.draft.entityIdsBySlotId[reading.id] = `sensor.fixture_${index}`;
          state.published.entityIdsBySlotId[reading.id] = `sensor.fixture_${index}`;
          state.manualSlotIds.push(reading.id);
          if (item.lightSlotId) {
            const id = api.lightingEntitySlotId(item.lightSlotId);
            state.draft.entityIdsBySlotId[id] = `light.fixture_${index}`;
            state.published.entityIdsBySlotId[id] = `light.fixture_${index}`;
            state.manualSlotIds.push(id);
          }
        }
      }
      const original = structuredClone(before);
      const pack = await api.readCabaneModelPack(api.createCabaneModelPack([changed], [asset]));
      const checkpoint = serial;
      const edited = editCustomModel(before, changed);
      serial = checkpoint;
      const imported = api.importCustomModels(before, pack.models);
      assert.deepEqual(JSON.parse(JSON.stringify(imported)), JSON.parse(JSON.stringify(edited)));
      assert.equal(api.validateHomeProject(imported.project, native).valid, true);
      assert.deepEqual(before, original);
      const manifest = api.composeHomeBindingManifest(imported.project, {
        ...native,
        openingModels: {},
      });
      const slotIds = new Set(api.collectBindingSlots(manifest).map((slot) => slot.slotId));
      for (const [index, item] of imported.project.sceneItems.entries()) {
        assert.deepEqual(item.placement, before.project.sceneItems[index].placement);
        assert.equal(item.floorId, before.project.sceneItems[index].floorId);
        assert.deepEqual(
          item.entitySlots.filter(api.isAuxiliaryEntitySlot),
          before.project.sceneItems[index].entitySlots.filter(api.isAuxiliaryEntitySlot),
        );
        assert.equal(
          Boolean(api.lightingSlotForItem(item)),
          Boolean(changed.light) || changed.profile === "light",
        );
        if (changed.light) {
          assert.ok(slotIds.has(api.lightingSlotForItem(item).id));
          assert.equal(Boolean(item.lightSlotId), changed.profile !== "light");
        } else assert.equal(item.lightSlotId, undefined);
      }
      for (const [origin, state] of Object.entries(imported.bindings)) {
        assert.deepEqual(state.published, before.bindings[origin].published);
        assert.ok(Object.keys(state.draft.entityIdsBySlotId).every((id) => slotIds.has(id)));
        for (let index = 0; index < 3; index++)
          assert.equal(
            state.draft.entityIdsBySlotId[`reading-${index}`],
            `sensor.fixture_${index}`,
          );
      }
      const history = api.commitWorkspaceSnapshot(api.createWorkspaceHistory(before), imported);
      assert.equal(history.past.length, 1);
      assert.deepEqual(api.undoWorkspaceHistory(history).present, before);
      assert.deepEqual(
        api.redoWorkspaceHistory(api.undoWorkspaceHistory(history)).present,
        imported,
      );
      assert.equal("bytes" in imported.project.customModels[0].asset, false);
      assert.equal(JSON.stringify(imported.project).includes("sensor.fixture_"), false);
    }
  });

  test("pack recovery and missing-model replacement retain compatible controls, readings and authored size", () => {
    const before = fixture();
    before.project.customModels = [];
    const reading = {
      id: "retained-reading",
      compatibleDomains: ["sensor"],
      required: false,
      autoMap: "manual",
      deviceRole: "secondary",
      presentation: { label: "Temperature", dashboardRole: "secondary" },
    };
    before.project.sceneItems[0].entitySlots.push(reading);
    for (const state of Object.values(before.bindings)) {
      state.draft.entityIdsBySlotId[reading.id] = "sensor.retained";
      state.published.entityIdsBySlotId[reading.id] = "sensor.retained";
      state.manualSlotIds.push(reading.id);
    }
    const unchanged = structuredClone(before);
    const restored = api.importCustomModels(before, [model]);
    assert.deepEqual(restored.project.sceneItems, before.project.sceneItems);
    assert.deepEqual(restored.bindings, before.bindings);
    const { light: _light, ...base } = model;
    const replacement = {
      ...base,
      id: "custom:aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      profile: "sensor",
    };
    const recovered = api.importCustomModels(before, [replacement], {
      modelId: model.id,
      kind: "device",
    });
    for (const [index, item] of recovered.project.sceneItems.entries()) {
      assert.equal(item.modelId, replacement.id);
      assert.deepEqual(item.entitySlots[0].compatibleDomains, ["sensor"]);
      assert.notEqual(item.entitySlots[0].id, before.project.sceneItems[index].entitySlots[0].id);
      assert.deepEqual(item.size, before.project.sceneItems[index].size);
      assert.deepEqual(item.placement, before.project.sceneItems[index].placement);
    }
    assert.equal(api.validateHomeProject(recovered.project, native).valid, true);
    assert.deepEqual(recovered.project.sceneItems[0].entitySlots[1], reading);
    for (const [origin, state] of Object.entries(recovered.bindings)) {
      assert.deepEqual(state.draft.entityIdsBySlotId, { "retained-reading": "sensor.retained" });
      assert.deepEqual(state.manualSlotIds, [reading.id]);
      assert.deepEqual(state.published, before.bindings[origin].published);
    }
    assert.deepEqual(before, unchanged);
  });

  test("batch pack updates reject immutable asset conflicts before changing any definitions or copies", () => {
    const before = fixture();
    const original = structuredClone(before);
    const added = { ...model, id: "custom:aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" };
    assert.throws(
      () =>
        api.importCustomModels(before, [
          added,
          { ...model, asset: { ...model.asset, byteLength: model.asset.byteLength + 1 } },
        ]),
      /cannot replace.*GLB/,
    );
    assert.deepEqual(before, original);
    const next = api.importCustomModels(before, [added, { ...model, name: "Renamed" }]);
    assert.deepEqual(
      next.project.customModels.map((model) => model.name),
      ["Renamed", model.name],
    );
    assert.deepEqual(next.project.sceneItems, before.project.sceneItems);
    assert.deepEqual(next.bindings, before.bindings);
  });

  test("same-asset model-pack profile updates reconcile placed copies through the library", () =>
    withStorageDom(async (dom) => {
      const before = fixture();
      const { light: _light, ...base } = model;
      const changed = { ...base, profile: "sensor" };
      const bytes = api.createCabaneModelPack([changed], [asset]);
      let committed;
      await dom.mount(async () => {
        const container = dom.document.createElement("div");
        dom.document.body.append(container);
        const root = createRoot(container);
        root.render(
          React.createElement(CustomModelLibrary, {
            workspace: {
              snapshot: before,
              modelAssetReferences: [model.asset],
              commit: (next) => {
                committed = next;
              },
              flush: async () => ({ status: "saved" }),
            },
            disabled: false,
            onBrowse: () => {},
            editingModel: null,
            onCloseEditor: () => {},
            onEditSnapshot: () => {},
          }),
        );
        return { unmount: () => root.unmount() };
      });
      const input = dom.document.querySelector('input[accept^=".zip"]');
      Object.defineProperty(input, "files", {
        value: [{ name: "fixture.zip", size: bytes.length, arrayBuffer: async () => bytes.buffer }],
      });
      await React.act(async () =>
        input.dispatchEvent(new dom.window.Event("change", { bubbles: true })),
      );
      await dom.click("Import pack");
      await dom.until(() => committed);
      assert.deepEqual(api.validateHomeProject(committed.project, native).issues, []);
      assert.deepEqual(committed.bindings, editCustomModel(before, changed).bindings);
      assert.deepEqual(
        await api.createModelAssetRepository(dom.indexedDB).read(asset.sha256),
        asset.bytes,
      );
    }));

  test("missing stored assets leave the model unchanged, block Save, and allow cancellation", () =>
    withStorageDom(async (dom) => {
      dom.window.HTMLElement.prototype.attachEvent = () => {};
      dom.window.HTMLElement.prototype.detachEvent = () => {};
      let imports = 0;
      const opener = dom.document.createElement("button");
      dom.document.body.append(opener);
      opener.focus();
      await dom.mount(async () => {
        const container = dom.document.createElement("div");
        dom.document.body.append(container);
        const root = createRoot(container);
        root.render(
          React.createElement(ModelImportDialog, {
            existingModel: { ...model, asset: { ...model.asset, sha256: "f".repeat(64) } },
            missingModelOptions: [],
            onImport: async () => {
              imports++;
            },
            onCancel: () => root.render(null),
          }),
        );
        return { unmount: () => root.unmount() };
      });
      await dom.until(() => dom.document.querySelector('[role="alert"]'));
      assert.equal(dom.button("Save changes").disabled, true);
      assert.equal(dom.document.querySelector("input").value, model.name);
      await dom.click("Cancel");
      assert.equal(dom.document.querySelector("dialog"), null);
      assert.equal(dom.document.activeElement, opener);
      assert.equal(imports, 0);
    }));
});
