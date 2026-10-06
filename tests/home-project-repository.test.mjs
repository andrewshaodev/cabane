import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const {
    defineHomeProject,
    autosaveHomeProjectDraft,
    createHomeProjectLifecycle,
    createHomeProjectRepository,
    createIndexedDbProjectRecordStore,
    createMemoryProjectRecordStore,
    createSeedProjectRecord,
    parseHomeProject,
    publishHomeProject,
    resetHomeProjectDraftToPublished,
    serializeHomeProject,
    serializeHomeProjectRecord,
  } = await load("/packages/engine/src/home-project/index.ts");

  const registries = { furnishingModels: {}, deviceModels: {} };

  const createFakeIndexedDb = () => {
    const records = new Map();
    const storeMaps = new Map([["home-projects", records]]);
    const created = new Set();
    const database = {
      objectStoreNames: { contains: (name) => created.has(name) },
      createObjectStore: (name) => {
        created.add(name);
        if (!storeMaps.has(name)) storeMaps.set(name, new Map());
      },
      close: () => undefined,
      transaction: (name, mode) => {
        assert.ok((Array.isArray(name) ? name : [name]).every(key => created.has(key)));
        assert.ok(["readonly", "readwrite"].includes(mode));
        let pendingCount = 0;
        const transaction = {
          error: null,
          objectStore: (storeName) => {
            const records = storeMaps.get(storeName);
            const request = (operation) => {
              const pending = { result: undefined, error: null };
              pendingCount += 1;
              queueMicrotask(() => {
                pending.result = operation();
                pending.onsuccess?.();
                pendingCount -= 1;
                queueMicrotask(() => { if (pendingCount === 0) transaction.oncomplete?.(); });
              });
              return pending;
            };
            return {
              get: (key) => request(() => records.get(key)),
              put: (value, key) => request(() => {
                records.set(key, value);
                return key;
              }),
              delete: (key) => request(() => {
                records.delete(key);
                return undefined;
              }),
            };
          },
        };
        return transaction;
      },
    };
    return {
      open: (name, version) => {
        assert.equal(name, "cabane-projects-v2");
        assert.equal(version, 3);
        const request = { result: database, error: null };
        queueMicrotask(() => {
          if (!created.size) request.onupgradeneeded?.();
          request.onsuccess?.();
        });
        return request;
      },
      records,
    };
  };

  const fixtureProject = () => defineHomeProject({
    schemaVersion: 1,
    seedRevision: "fixture-v1",
    home: {
      id: "fixture-home",
      name: "Fixture home",
      locale: "en",
      palette: {
        accent: "#d48a54",
        secondary: "#758f83",
        exterior: "#c97370",
        interior: "#e4e0d8",
        ground: "#91a06a",
      },
    },
    floor: {
      id: "ground-floor",
      name: "Ground floor",
      coordinates: {
        origin: [0, 0],
        metersPerPlanUnit: 1,
        scaleBasis: "measured",
      },
      defaultWallHeightMeters: 2.4,
      defaultCeilingHeightMeters: 2.4,
      footprint: [[0, 0], [4, 0], [4, 3], [0, 3]],
      rooms: [{
        id: "room",
        name: "Room",
        polygon: [[0.12, 0.12], [3.88, 0.12], [3.88, 2.88], [0.12, 2.88]],
        accent: "#c98164",
        dashboardSlots: [],
        devices: [],
      }],
      walls: [
        { id: "north", from: [0, 0], to: [4, 0], classification: "exterior", thicknessMeters: 0.18 },
        { id: "east", from: [4, 0], to: [4, 3], classification: "exterior", thicknessMeters: 0.18 },
        { id: "south", from: [4, 3], to: [0, 3], classification: "exterior", thicknessMeters: 0.18 },
        { id: "west", from: [0, 3], to: [0, 0], classification: "exterior", thicknessMeters: 0.18 },
      ],
      wallJunctions: [
        { id: "north-west", at: [0, 0], wallIds: ["north", "west"] },
        { id: "north-east", at: [4, 0], wallIds: ["north", "east"] },
        { id: "south-east", at: [4, 3], wallIds: ["east", "south"] },
        { id: "south-west", at: [0, 3], wallIds: ["south", "west"] },
      ],
      openings: [],
      ceilings: [{
        id: "room-ceiling",
        kind: "flat",
        roomIds: ["room"],
        heightMeters: 2.4,
      }],
    },
    sceneItems: [],
    roomProfiles: { room: { dashboardSlots: [] } },
    openingProfiles: {},
    shortcuts: [],
    assumptions: [],
  });

  test("serializes projects canonically and reports corrupt JSON", () => {
    const project = fixtureProject();
    const serialized = serializeHomeProject(project);
    assert.equal(serialized.endsWith("\n"), true);
    assert.equal(serialized.startsWith('{\n  "assumptions"'), true);
    assert.deepEqual(parseHomeProject(serialized), { valid: true, project });
    const corrupt = parseHomeProject("{not-json");
    assert.equal(corrupt.valid, false);
    assert.equal(corrupt.issues[0].code, "project.json");
  });

  test("round-trips one versioned record", async () => {
    const store = createMemoryProjectRecordStore();
    const repository = createHomeProjectRepository(store, registries);
    const record = createSeedProjectRecord(fixtureProject(), 1000);
    await repository.replace(record);
    assert.deepEqual(await repository.load("fixture-home"), record);
    assert.equal(store.snapshot("fixture-home"), serializeHomeProjectRecord(record));
  });

  test("round-trips through the IndexedDB project store", async () => {
    const indexedDb = createFakeIndexedDb();
    const store = createIndexedDbProjectRecordStore(indexedDb);
    const repository = createHomeProjectRepository(store, registries);
    const record = createSeedProjectRecord(fixtureProject(), 1000);
    await repository.replace(record);
    assert.deepEqual(await repository.load("fixture-home"), record);
    await store.delete("fixture-home");
    assert.equal(await store.read("fixture-home"), null);
  });

  test("persists a schema-valid but semantically invalid draft", async () => {
    const store = createMemoryProjectRecordStore();
    const repository = createHomeProjectRepository(store, registries);
    const record = createSeedProjectRecord(fixtureProject(), 1000);
    await repository.replace(record);
    const draft = structuredClone(record.draft);
    draft.floors[0].walls = [];
    const result = await autosaveHomeProjectDraft(repository, record, draft, 1100);
    assert.equal(result.status, "saved");
    assert.deepEqual((await repository.load("fixture-home")).draft.floors[0].walls, []);
    assert.equal((await repository.load("fixture-home")).published.floors[0].walls.length, 4);
  });

  test("rejects a corrupt reread and restores the last good record", async () => {
    let raw = null;
    let corruptNextRead = false;
    const store = {
      read: async () => {
        if (corruptNextRead) {
          corruptNextRead = false;
          return "{not-json";
        }
        return raw;
      },
      write: async (_homeId, serialized) => {
        raw = serialized;
        if (JSON.parse(serialized).draftUpdatedAt === 2000) corruptNextRead = true;
      },
      delete: async () => {
        raw = null;
      },
    };
    const repository = createHomeProjectRepository(store, registries);
    const first = createSeedProjectRecord(fixtureProject(), 1000);
    await repository.replace(first);
    const second = { ...first, draftUpdatedAt: 2000 };
    await assert.rejects(repository.replace(second), /verification failed/i);
    assert.equal(JSON.parse(raw).draftUpdatedAt, 1000);
  });

  test("serializes concurrent writes so late autosaves cannot overtake", async () => {
    let raw = null;
    let writes = 0;
    const store = {
      read: async () => raw,
      write: async (_homeId, serialized) => {
        writes += 1;
        if (writes === 2) await new Promise((resolve) => setTimeout(resolve, 20));
        raw = serialized;
      },
    };
    const repository = createHomeProjectRepository(store, registries);
    const first = await repository.replace(createSeedProjectRecord(fixtureProject(), 1000));
    const saveOne = repository.replace({ ...first, draftUpdatedAt: 2000 });
    const saveTwo = repository.replace({ ...first, draftUpdatedAt: 3000 });
    await Promise.all([saveOne, saveTwo]);
    assert.equal(JSON.parse(raw).draftUpdatedAt, 3000);
  });

  test("loads an existing browser record without overwriting it for a newer seed", async () => {
    const store = createMemoryProjectRecordStore();
    const repository = createHomeProjectRepository(store, registries);
    const original = createSeedProjectRecord(fixtureProject(), 1000);
    original.draft.home.name = "Browser draft";
    await repository.replace(original);
    const newerSeed = fixtureProject();
    newerSeed.home.name = "New bundled seed";
    const loaded = await repository.loadOrCreate(newerSeed, 2000);
    assert.equal(loaded.status, "ready");
    assert.equal(loaded.source, "indexeddb");
    assert.equal(loaded.record.draft.home.name, "Browser draft");
  });

  test("returns corrupt storage as recovery data without replacing it", async () => {
    const raw = "{not-json";
    const store = createMemoryProjectRecordStore({ "fixture-home": raw });
    const repository = createHomeProjectRepository(store, registries);
    const loaded = await repository.loadOrCreate(fixtureProject(), 1000);
    assert.equal(loaded.status, "recovery");
    assert.equal(loaded.raw, raw);
    assert.equal(loaded.record.published.home.name, "Fixture home");
    assert.equal(store.snapshot("fixture-home"), raw);
  });

  test("recovers only the exact invalid raw snapshot, never a valid or changed record", async () => {
    const seed = fixtureProject();
    const raw = "{not-json";
    const store = createMemoryProjectRecordStore({ "fixture-home": raw });
    const repository = createHomeProjectRepository(store, registries);
    const recovered = await repository.recover(seed, raw, 2000);
    assert.deepEqual(recovered.draft, seed);
    assert.deepEqual(recovered.published, seed);
    assert.deepEqual(recovered.bindings, {});
    assert.ok(Number.isSafeInteger(recovered.revision) && recovered.revision > 2 ** 40);
    assert.deepEqual(await repository.load(seed.home.id), recovered);
    const validRaw = store.snapshot(seed.home.id);
    await assert.rejects(repository.recover(seed, validRaw, 3000), /invalid|recovery/i);
    await assert.rejects(repository.recover(seed, raw, 3000), /changed/i);
    assert.equal(store.snapshot(seed.home.id), validRaw);
  });

  test("recovery advances any readable prior revision and rejects numeric exhaustion", async () => {
    const seed = fixtureProject();
    const priorRevision = 7_000_000_000_000_000;
    const raw = JSON.stringify({ schemaVersion: 999, revision: priorRevision });
    const store = createMemoryProjectRecordStore({ [seed.home.id]: raw });
    const repository = createHomeProjectRepository(store, registries);
    const recovered = await repository.recover(seed, raw, 2000);
    assert.equal(recovered.revision, priorRevision + 1);
    const exhausted = JSON.stringify({ schemaVersion: 999, revision: Number.MAX_SAFE_INTEGER });
    await store.write(seed.home.id, exhausted);
    await assert.rejects(repository.recover(seed, exhausted, 3000), /revision/i);
    assert.equal(store.snapshot(seed.home.id), exhausted);
  });

  test("blocks invalid publishing while preserving the published snapshot", async () => {
    const store = createMemoryProjectRecordStore();
    const repository = createHomeProjectRepository(store, registries);
    let record = await repository.replace(createSeedProjectRecord(fixtureProject(), 1000));
    const draft = structuredClone(record.draft);
    draft.floors[0].walls = [];
    const save = await autosaveHomeProjectDraft(repository, record, draft, 1100);
    assert.equal(save.status, "saved");
    record = save.record;
    const result = await publishHomeProject(repository, record, { now: 1200 });
    assert.equal(result.status, "blocked");
    assert.equal(result.errors.length > 0, true);
    assert.equal((await repository.load("fixture-home")).published.floors[0].walls.length, 4);
  });

  test("publishes a deep-cloned valid draft only after verified persistence", async () => {
    const store = createMemoryProjectRecordStore();
    const repository = createHomeProjectRepository(store, registries);
    let record = await repository.replace(createSeedProjectRecord(fixtureProject(), 1000));
    const draft = structuredClone(record.draft);
    draft.floors[0].name = "Edited floor";
    const saved = await autosaveHomeProjectDraft(repository, record, draft, 1100);
    assert.equal(saved.status, "saved");
    record = saved.record;
    const result = await publishHomeProject(repository, record, { now: 1200 });
    assert.equal(result.status, "published");
    draft.floors[0].name = "Mutated after publish";
    assert.equal(result.record.published.floors[0].name, "Edited floor");
    assert.equal((await repository.load("fixture-home")).publishedAt, 1200);
  });

  test("orientation survives autosave, reload, Apply, and contact-profile preservation", async () => {
    const project = fixtureProject();
    project.floors[0].openings.push({ id: "door", wallId: "north", kind: "door", operation: "hinged", variant: "panel", finish: "wood", leafCount: 1,
      offsetFromWallStartPlanUnits: 1, widthPlanUnits: .9, openingHeightMeters: 2, sillHeightMeters: 0 });
    project.openingProfiles.door = { contactSlot: { id: "door-contact", compatibleDeviceClasses: ["door"], openState: "on", autoMap: "manual" } };
    const store = createMemoryProjectRecordStore();
    const repository = createHomeProjectRepository(store, registries);
    const original = await repository.replace(createSeedProjectRecord(project, 1000));
    const draft = structuredClone(original.draft);
    Object.assign(draft.floors[0].openings[0], { hingeSide: "end", openingSide: "left" });
    const saved = await autosaveHomeProjectDraft(repository, original, draft, 1100);
    assert.equal(saved.status, "saved");
    const reloaded = await createHomeProjectRepository(store, registries).load("fixture-home");
    assert.deepEqual(reloaded.draft.floors[0].openings, draft.floors[0].openings);
    assert.equal(reloaded.published.floors[0].openings[0].hingeSide, undefined);
    const result = await publishHomeProject(repository, reloaded, { now: 1200 });
    assert.equal(result.status, "published");
    assert.deepEqual(result.record.published.floors[0].openings, draft.floors[0].openings);
    assert.deepEqual(result.record.published.openingProfiles, original.published.openingProfiles);
  });

  test("keeps the previous published record when publish storage fails", async () => {
    let raw = null;
    let failNextWrite = false;
    const store = {
      read: async () => raw,
      write: async (_homeId, serialized) => {
        if (failNextWrite) {
          failNextWrite = false;
          throw new Error("quota exceeded");
        }
        raw = serialized;
      },
    };
    const repository = createHomeProjectRepository(store, registries);
    let record = await repository.replace(createSeedProjectRecord(fixtureProject(), 1000));
    const draft = structuredClone(record.draft);
    draft.floors[0].name = "Edited floor";
    const saved = await autosaveHomeProjectDraft(repository, record, draft, 1100);
    assert.equal(saved.status, "saved");
    record = saved.record;
    failNextWrite = true;
    const result = await publishHomeProject(repository, record, { now: 1200 });
    assert.equal(result.status, "storage-error");
    assert.equal(JSON.parse(raw).published.floors[0].name, "Ground floor");
  });

  test("requires one explicit confirmation when validation returns warnings only", async () => {
    const store = createMemoryProjectRecordStore();
    const base = createHomeProjectRepository(store, registries);
    const record = await base.replace(createSeedProjectRecord(fixtureProject(), 1000));
    const warning = { code: "fixture.warning", path: "floor", message: "Review this.", severity: "warning" };
    const repository = { ...base, validate: () => ({ valid: false, issues: [warning] }) };
    const first = await publishHomeProject(repository, record, { now: 1200 });
    assert.equal(first.status, "confirmation-required");
    const confirmed = await publishHomeProject(repository, record, { confirmWarnings: true, now: 1200 });
    assert.equal(confirmed.status, "published");
  });

  test("resets a draft to published and exposes canonical raw export", async () => {
    const store = createMemoryProjectRecordStore();
    const repository = createHomeProjectRepository(store, registries);
    let record = await repository.replace(createSeedProjectRecord(fixtureProject(), 1000));
    const draft = structuredClone(record.draft);
    draft.floors[0].name = "Unsaved direction";
    record = (await autosaveHomeProjectDraft(repository, record, draft, 1100)).record;
    const reset = await resetHomeProjectDraftToPublished(repository, record, 1200);
    assert.equal(reset.status, "saved");
    assert.equal(reset.record.draft.floors[0].name, "Ground floor");
    const lifecycle = createHomeProjectLifecycle(repository, fixtureProject(), () => 1300);
    const { revision: _revision, bindings: _bindings, ...portableRecord } = reset.record;
    assert.deepEqual(JSON.parse(lifecycle.exportRecord(reset.record)), portableRecord);
    assert.equal(await lifecycle.exportStoredRaw(), serializeHomeProjectRecord(reset.record));
  });
});
