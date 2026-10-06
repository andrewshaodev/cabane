import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const engine = await load("/packages/engine/src/index.ts");
  const { ownerHomeProject } = await load("/tests/fixtures/bundled-home.ts");
  const {
    composeOwnerProjectManifest,
    deleteOriginProfiles,
    ownerProjectRegistries,
    migrateOriginProfile,
  } = await load("/apps/web/src/project-runtime.ts");
  const manifest = composeOwnerProjectManifest(ownerHomeProject);
  const origin = "https://synthetic.invalid";
  const empty = engine.createEmptyRuntimeBindingProfile(ownerHomeProject.home.id);
  const room = manifest.floors[0].rooms[0];
  const profile = { ...empty, roomAreaIds: { [room.id]: "synthetic-area" } };
  const fixture = async () => {
    const repository = engine.createHomeProjectRepository(
      engine.createMemoryProjectRecordStore(),
      ownerProjectRegistries,
    );
    const lifecycle = engine.createHomeProjectLifecycle(repository, ownerHomeProject);
    return { repository, lifecycle, record: (await lifecycle.load()).record };
  };
  test("known-origin migration retains legacy data, preserves live profile, and refuses stale records", async () => {
    const { repository, record } = await fixture();
    const raw = JSON.stringify(profile);
    const map = new Map([[engine.runtimeBindingProfileStorageKey(origin, record.homeId), raw]]);
    const storage = { getItem: (key) => map.get(key) ?? null };
    const replace = (candidate, revision) => repository.replace(candidate, revision);
    const migrated = await migrateOriginProfile(record, `${origin}/`, storage, replace);
    assert.deepEqual(migrated.bindings[origin].published, profile);
    assert.deepEqual(migrated.bindings[origin].draft, profile);
    assert.deepEqual(migrated.published, record.published);
    assert.equal(map.values().next().value, raw);
    assert.equal(await migrateOriginProfile(migrated, origin, storage, replace), migrated);
    await assert.rejects(migrateOriginProfile(record, origin, storage, replace), /another tab/);
    assert.equal(
      await migrateOriginProfile(migrated, "https://different.invalid", storage, replace),
      migrated,
    );
  });
  test("malformed legacy profiles report recovery without replacing any record", async () => {
    const { record } = await fixture();
    for (const raw of [
      "{",
      JSON.stringify({ ...profile, token: "secret" }),
      JSON.stringify({ ...profile, homeId: "other" }),
    ]) {
      let writes = 0;
      await assert.rejects(
        migrateOriginProfile(record, origin, { getItem: () => raw }, async () => {
          writes++;
          return record;
        }),
      );
      assert.equal(writes, 0);
      assert.deepEqual(record.bindings, {});
    }
  });
  test("deleting old connections removes both origin-specific browser profiles only", async () => {
    const homeId = ownerHomeProject.home.id;
    const currentKey = engine.runtimeBindingProfileStorageKey(origin, homeId);
    const legacyKey = engine.legacyRuntimeBindingProfileStorageKey(origin, homeId);
    const map = new Map([
      [currentKey, "current"],
      [legacyKey, "legacy"],
      ["unrelated", "keep"],
    ]);
    deleteOriginProfiles(`${origin}/`, homeId, { removeItem: (key) => map.delete(key) });
    assert.deepEqual([...map], [["unrelated", "keep"]]);
  });
});
