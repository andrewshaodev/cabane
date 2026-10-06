import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const api = await load("/packages/engine/src/home-project/index.ts");
  const { makeLegacyProject, makeThreeFloorProject, emptyRegistries } = await load(
    "/tests/fixtures/multiple-floors.ts",
  );
  test("reads a legacy record without overwriting raw and writes the new version atomically", async () => {
    const legacy = makeLegacyProject();
    const raw = JSON.stringify({
      homeId: legacy.home.id,
      schemaVersion: 1,
      seedRevision: legacy.seedRevision,
      draft: legacy,
      published: legacy,
      draftUpdatedAt: 1,
      publishedAt: 1,
      revision: 7,
      bindings: {},
    });
    const store = api.createMemoryProjectRecordStore({ [legacy.home.id]: raw });
    const repository = api.createHomeProjectRepository(store, emptyRegistries);
    const record = await repository.load(legacy.home.id);
    assert.equal(record.schemaVersion, 2);
    assert.equal(record.draft.schemaVersion, 2);
    assert.equal(store.snapshot(legacy.home.id), raw);
    const next = await repository.replace(record, 7);
    assert.equal(next.revision, 8);
    assert.equal(JSON.parse(store.snapshot(legacy.home.id)).schemaVersion, 2);
    await assert.rejects(repository.replace(record, 7), /another tab/);
  });
  test("autosaves an empty top floor without dropping its binding envelope", async () => {
    const seed = makeThreeFloorProject();
    const repository = api.createHomeProjectRepository(
      api.createMemoryProjectRecordStore(),
      emptyRegistries,
    );
    const loaded = await repository.loadOrCreate(seed, 1);
    const draft = structuredClone(seed);
    draft.floors[2] = {
      ...draft.floors[2],
      footprint: [],
      rooms: [],
      walls: [],
      wallJunctions: [],
      openings: [],
      ceilings: [],
    };
    const saved = await api.autosaveHomeProjectDraft(repository, loaded.record, draft, 2);
    assert.equal(saved.status, "saved", saved.error?.message);
    const reloaded = await repository.load(seed.home.id);
    assert.deepEqual(reloaded.draft.floors[2].footprint, []);
    assert.equal(reloaded.published.floors[2].rooms.length, 1);
  });
});
