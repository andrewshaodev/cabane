import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const engine = await load("/packages/engine/src/index.ts");
  const transfer = await load("/apps/web/src/editor-connect/profile-transfer.ts");
  const { ownerHomeProject } = await load("/tests/fixtures/bundled-home.ts");
  const { composeOwnerProjectManifest, ownerProjectRegistries } = await load(
    "/apps/web/src/project-runtime.ts",
  );
  const manifest = composeOwnerProjectManifest(ownerHomeProject);
  const origin = "https://synthetic.invalid";
  const empty = engine.createEmptyRuntimeBindingProfile(manifest.home.id);
  const imported = {
    ...empty,
    roomAreaIds: { [manifest.floors[0].rooms[0].id]: "synthetic-private-area" },
  };
  const record = engine.createSeedProjectRecord(ownerHomeProject, 1);
  record.bindings = {
    [origin]: { draft: empty, published: empty, manualRoomIds: [], manualSlotIds: [] },
  };

  test("profile import stages only private draft and exports only published mapping", () => {
    const before = structuredClone(record);
    const staged = transfer.stageImportedProfile(
      record.bindings,
      origin,
      JSON.stringify(imported),
      manifest,
    );
    assert.deepEqual(staged[origin].draft, imported);
    assert.deepEqual(staged[origin].published, empty);
    assert.deepEqual(record, before);
    assert.deepEqual(
      JSON.parse(transfer.exportPublishedProfile(staged, origin, record.homeId)),
      empty,
    );
    assert.ok(staged[origin].manualRoomIds.includes(manifest.floors[0].rooms[0].id));
  });
  test("invalid or credential-bearing profile imports leave all workspace slices untouched", () => {
    const before = structuredClone(record);
    for (const json of [
      "{",
      JSON.stringify({ ...imported, token: "must-not-import" }),
      JSON.stringify({ ...imported, homeId: "other" }),
    ]) {
      assert.throws(() => transfer.stageImportedProfile(record.bindings, origin, json, manifest));
      assert.deepEqual(record, before);
    }
  });
  test("explicit private backup roundtrips as a draft without activating imported published state; portable export stays private-ID-free", () => {
    const source = {
      ...record,
      bindings: transfer.stageImportedProfile(
        record.bindings,
        origin,
        JSON.stringify(imported),
        manifest,
      ),
    };
    const json = transfer.exportPrivateWorkspace(source);
    assert.match(json, /synthetic-private-area/);
    const staged = transfer.stageImportedWorkspace(record, json, ownerProjectRegistries);
    assert.deepEqual(staged.bindings[origin].draft, imported);
    assert.deepEqual(staged.bindings[origin].published, empty);
    assert.deepEqual(record.published, ownerHomeProject);
    const lifecycle = engine.createHomeProjectLifecycle(
      engine.createHomeProjectRepository(
        engine.createMemoryProjectRecordStore(),
        ownerProjectRegistries,
      ),
      ownerHomeProject,
    );
    const portable = lifecycle.exportRecord(source);
    assert.doesNotMatch(portable, /synthetic-private-area|synthetic.invalid/);
    assert.equal("bindings" in JSON.parse(portable), false);
    assert.throws(() =>
      transfer.stageImportedWorkspace(
        record,
        JSON.stringify({ ...source, access_token: "secret" }),
        ownerProjectRegistries,
      ),
    );
  });
});

await withModules(async (load) => {
  const { parseWorkspaceImport, exportWorkspaceBackup } = await load(
    "/apps/web/src/workspaces/workspace-transfer.ts",
  );
  const { createEmptyHomeProject, createSeedProjectRecord, createEmptyRuntimeBindingProfile } =
    await load("/packages/engine/src/index.ts");
  const registries = { furnishingModels: {}, deviceModels: {} };
  const project = () => createEmptyHomeProject("synthetic-home", "Test home");
  const { interactionFloor } = await load("/tests/fixtures/interaction-floor.ts");
  const { stableFurnishingRegistry } = await load("/packages/catalog/src/furnishing/index.ts");
  const missingModelFixture = () => {
    const home = project();
    home.floors = [{ ...home.floors[0], ...structuredClone(interactionFloor), openings: [] }];
    const item = {
      id: "shelf",
      kind: "furnishing",
      floorId: home.floors[0].id,
      modelId: "oak-floating-shelf",
      size: [1.1, 0.035, 0.24],
      placement: { kind: "absolute", at: [2, 2], elevationMeters: 0, rotationYRadians: 0 },
    };
    home.sceneItems = [item];
    return { home, item, models: registries };
  };
  test("missing catalog models import through portable and private formats as placeholders", () => {
    const { home, item, models } = missingModelFixture();
    const record = createSeedProjectRecord(home);
    for (const json of [
      JSON.stringify(home),
      JSON.stringify(record),
      exportWorkspaceBackup(
        { name: home.home.name, hasPublished: true, homeAssistantUrl: null },
        record,
      ),
    ]) {
      const imported = parseWorkspaceImport(json, models);
      assert.deepEqual(
        imported.record.draft.sceneItems.find((candidate) => candidate.id === item.id),
        item,
      );
    }
  });
  test("a missing-model warning cannot mask the error that blocks a private import", () => {
    const { home, item, models } = missingModelFixture();
    item.placement = {
      kind: "wall",
      wallId: "missing-wall",
      face: "left",
      offsetFromWallStartPlanUnits: 1,
      elevationMeters: 1,
      depthOffsetMeters: 0,
      rotationOffsetRadians: 0,
    };
    const record = createSeedProjectRecord(home);
    for (const json of [
      JSON.stringify(record),
      exportWorkspaceBackup(
        { name: home.home.name, hasPublished: true, homeAssistantUrl: null },
        record,
      ),
    ]) {
      assert.throws(() => parseWorkspaceImport(json, models), /Wall “missing-wall” does not exist/);
    }
  });
  test("older catalogs import a missing shelf and newer bed variant without losing either ID", () => {
    const { home } = missingModelFixture();
    const { variants: _variants, ...legacyBed } = stableFurnishingRegistry["double-bed"];
    const models = { ...registries, furnishingModels: { "double-bed": legacyBed } };
    const bed = {
      id: "bed",
      kind: "furnishing",
      floorId: home.floors[0].id,
      modelId: "double-bed",
      variant: "cozy-white-blue",
      size: legacyBed.defaultSize,
      placement: { kind: "absolute", at: [4, 4], elevationMeters: 0, rotationYRadians: 0 },
    };
    home.sceneItems.push(bed);
    const record = createSeedProjectRecord(home);
    for (const json of [
      JSON.stringify(home),
      exportWorkspaceBackup(
        { name: home.home.name, hasPublished: true, homeAssistantUrl: null },
        record,
      ),
    ]) {
      const imported = parseWorkspaceImport(json, models);
      assert.deepEqual(imported.record.draft.sceneItems, home.sceneItems);
    }
  });
  test("portable blank designs import as an unapplied home without private configuration", () => {
    const imported = parseWorkspaceImport(JSON.stringify(project()), registries);
    assert.equal(imported.hasPublished, false);
    assert.equal(imported.record.publishedAt, 0);
    assert.equal(imported.homeAssistantUrl, null);
    assert.deepEqual(imported.record.bindings, {});
    assert.notEqual(imported.record.draft, imported.record.published);
  });
  test("private backup preserves an unapplied draft and allowlists metadata", () => {
    const record = createSeedProjectRecord(project());
    record.publishedAt = 0;
    const metadata = {
      name: "Saved home",
      hasPublished: false,
      homeAssistantUrl: "https://synthetic.invalid",
      token: "should-not-export",
    };
    const json = exportWorkspaceBackup(metadata, record);
    assert.equal(json.includes("should-not-export"), false);
    const imported = parseWorkspaceImport(json, registries);
    assert.equal(imported.name, "Saved home");
    assert.equal(imported.homeAssistantUrl, "https://synthetic.invalid");
    assert.deepEqual(imported.record, record);
  });
  test("bare private records infer only one binding origin and retain multiple origins", () => {
    const record = createSeedProjectRecord(project());
    record.publishedAt = 0;
    const profile = createEmptyRuntimeBindingProfile(record.homeId);
    const state = { draft: profile, published: profile, manualRoomIds: [], manualSlotIds: [] };
    record.bindings = { "https://one.invalid": state };
    assert.equal(
      parseWorkspaceImport(JSON.stringify(record), registries).homeAssistantUrl,
      "https://one.invalid",
    );
    record.bindings["https://two.invalid"] = state;
    const imported = parseWorkspaceImport(JSON.stringify(record), registries);
    assert.equal(imported.homeAssistantUrl, null);
    assert.equal(imported.hasPublished, false);
    assert.deepEqual(imported.record.bindings, record.bindings);
  });
  test("exports exclude extra credential properties and imports reject them", () => {
    const record = createSeedProjectRecord(project());
    record.publishedAt = 0;
    record.access_token = "fixture-secret";
    const metadata = { name: "Home", hasPublished: false, homeAssistantUrl: null };
    assert.equal(exportWorkspaceBackup(metadata, record).includes("fixture-secret"), false);
    assert.throws(() => parseWorkspaceImport(JSON.stringify(record), registries), /not part/);
  });
  test("existing portable record envelopes stage their draft as unapplied", () => {
    const record = createSeedProjectRecord(project());
    record.publishedAt = 0;
    const { bindings, revision, ...portable } = record;
    const result = parseWorkspaceImport(JSON.stringify(portable), registries);
    assert.equal(result.hasPublished, false);
    assert.equal(result.record.publishedAt, 0);
    assert.equal(result.homeAssistantUrl, null);
    assert.deepEqual(result.record.draft, record.draft);
  });
  test("rejects malformed files, unknown envelope versions and inconsistent applied status", () => {
    assert.throws(() => parseWorkspaceImport("no", registries), /valid Cabane JSON/);
    assert.throws(
      () => parseWorkspaceImport('{"format":"cabane-workspace","version":9}', registries),
      /Unsupported/,
    );
    const record = createSeedProjectRecord(project());
    record.publishedAt = 0;
    assert.throws(
      () =>
        parseWorkspaceImport(
          exportWorkspaceBackup(
            { name: "Test", homeAssistantUrl: null, hasPublished: true },
            record,
          ),
          registries,
        ),
      /applied status/,
    );
  });
});
