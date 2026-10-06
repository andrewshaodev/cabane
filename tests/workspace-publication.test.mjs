import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

// Requests execute in order, writes remain staged until completion, and abort
// discards them. Separate readwrite transactions cannot observe partial writes.
const transactionalIndexedDb = () => {
  const records = new Map();
  const transactions = [];
  const stores = new Map([["home-projects", records]]);
  const created = new Set();
  let queue = Promise.resolve();
  let fault;
  const database = {
    objectStoreNames: { contains: name => created.has(name) },
    createObjectStore: name => { created.add(name); if (!stores.has(name)) stores.set(name, new Map()); },
    close: () => {},
    transaction: (_name, mode) => {
      let staged;
      let aborted = false;
      let complete;
      let pending = 0;
      let started = false;
      const operations = [];
      const counts = {};
      const done = new Promise((resolve) => { complete = resolve; });
      const transaction = {
        mode,
        error: null,
        abort: () => {
          aborted = true;
          queueMicrotask(() => { transaction.onabort?.(); complete(); });
        },
        objectStore: (name) => {
          const request = (kind, operation) => {
            const count = name === "home-projects" ? (counts[kind] = (counts[kind] ?? 0) + 1) : -1;
            const selectedFault = fault?.mode === mode && fault.kind === kind && fault.count === count ? fault : null;
            if (selectedFault) fault = undefined;
            if (selectedFault?.type === "throw") throw new Error("synthetic request throw");
            const request = { error: null, result: undefined };
            pending += 1;
            const execute = () => {
              if (aborted) return;
              if (selectedFault?.type === "error") {
                request.error = new Error("synthetic request error");
                request.onerror?.();
                if (!aborted) transaction.abort();
                return;
              }
              request.result = selectedFault?.type === "corrupt" ? "corrupt readback" : operation();
              request.onsuccess?.();
              pending -= 1;
              queueMicrotask(() => {
                if (!aborted && pending === 0) {
                  if (mode === "readwrite") {
                    for (const [name, values] of staged) {
                      const target = stores.get(name);
                      target.clear();
                      for (const [key, value] of values) target.set(key, value);
                    }
                  }
                  transaction.oncomplete?.();
                  complete();
                }
              });
            };
            if (started) queueMicrotask(execute);
            else operations.push(execute);
            return request;
          };
          return {
            get: (key) => request("get", () => staged.get(name).get(key)),
            put: (value, key) => request("put", () => { staged.get(name).set(key, value); return key; }),
            delete: (key) => request("delete", () => { staged.get(name).delete(key); }),
          };
        },
      };
      transactions.push(transaction);
      queue = queue.then(async () => {
        staged = new Map([...stores].map(([name, values]) => [name, new Map(values)]));
        started = true;
        for (const operation of operations) queueMicrotask(operation);
        await done;
      });
      return transaction;
    },
  };
  return {
    records,
    transactions,
    fail: (nextFault) => { fault = { mode: "readwrite", count: 1, ...nextFault }; },
    open: (name, version) => {
      assert.equal(name, "cabane-projects-v2");
      assert.equal(version, 2);
      const request = { result: database, error: null };
      queueMicrotask(() => {
        if (!created.size) request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
};

await withModules(async (load) => {
  const {
    createHomeProjectLifecycle, createHomeProjectRepository,
    createIndexedDbProjectRecordStore, createMemoryProjectRecordStore,
    createSeedProjectRecord, parseHomeProjectRecord, removeWorkspaceSlotReferences,
    serializeHomeProjectRecord,
  } = await load("/packages/engine/src/home-project/index.ts");
  const { ownerHomeProject, homeExtensions } = await load("/tests/fixtures/bundled-home.ts");
  const { stableDeviceRegistry } = await load("/packages/catalog/src/device/index.ts");
  const { stableFurnishingRegistry } = await load("/packages/catalog/src/furnishing/index.ts");
  const registries = {
    furnishingModels: { ...stableFurnishingRegistry, ...homeExtensions.furnishingModels },
    deviceModels: { ...stableDeviceRegistry, ...homeExtensions.deviceModels },
  };
  const origin = "https://fixture-ha.test";
  const fixture = async (store = createMemoryProjectRecordStore()) => {
    const seed = structuredClone(ownerHomeProject);
    const record = createSeedProjectRecord(seed, 1);
    const profile = {
      schemaVersion: 1, homeId: seed.home.id,
      roomAreaIds: { [seed.floors[0].rooms[0].id]: "fixture-published-area" }, entityIdsBySlotId: {},
    };
    record.bindings = Object.fromEntries([origin, "https://other-fixture-ha.test"].map((key) => [key, {
      draft: structuredClone(profile), published: structuredClone(profile), manualRoomIds: [], manualSlotIds: [],
    }]));
    const repository = createHomeProjectRepository(store, registries);
    await repository.replace(record);
    const lifecycle = createHomeProjectLifecycle(repository, seed);
    const changedHome = structuredClone(seed);
    changedHome.home.name = "Changed home";
    const changedBindings = structuredClone(record.bindings);
    for (const state of Object.values(changedBindings)) {
      state.draft.roomAreaIds[seed.floors[0].rooms[0].id] = "fixture-draft-area";
    }
    return { store, seed, record, repository, lifecycle, changedHome, changedBindings };
  };

  test("autosaves both drafts and publishes every origin with the project in one revision", async () => {
    const { record, repository, lifecycle, changedHome, changedBindings } = await fixture();
    const saved = await lifecycle.autosave(record, changedHome, 2, changedBindings);
    assert.equal(saved.status, "saved");
    assert.equal(saved.record.revision, record.revision + 1);
    assert.deepEqual(saved.record.published, record.published);
    assert.deepEqual(saved.record.bindings[origin].published, record.bindings[origin].published);
    assert.deepEqual(saved.record.bindings, changedBindings);
    const published = await lifecycle.publish(saved.record, { confirmWarnings: true, now: 3 });
    assert.equal(published.status, "published");
    assert.equal(published.record.revision, saved.record.revision + 1);
    assert.deepEqual(published.record.published, changedHome);
    for (const key of Object.keys(changedBindings)) {
      assert.deepEqual(published.record.bindings[key].published, changedBindings[key].draft);
    }
    assert.deepEqual(await repository.load(record.homeId), published.record);
    changedBindings[origin].draft.roomAreaIds = {};
    assert.notDeepEqual(published.record.bindings[origin].published.roomAreaIds, {});
  });

  test("publishing a deleted device promotes its cleaned draft mappings only on Apply", async () => {
    const { seed, record, lifecycle } = await fixture();
    const device = seed.sceneItems.find((item) => item.id === "primary-bedroom-pendant");
    assert.ok(device);
    const mappedBindings = structuredClone(record.bindings);
    for (const state of Object.values(mappedBindings)) {
      state.draft.roomAreaIds["primary-bedroom"] = "fixture-bedroom-area";
      state.draft.entityIdsBySlotId = Object.fromEntries(device.entitySlots.map((slot, index) => [
        slot.id,
        `${slot.compatibleDomains[0]}.fixture_${index}`,
      ]));
      state.published = structuredClone(state.draft);
      state.manualSlotIds = device.entitySlots.map((slot) => slot.id);
    }
    const mappedRecord = { ...record, bindings: mappedBindings };
    const draft = { ...seed, sceneItems: seed.sceneItems.filter((item) => item.id !== device.id) };
    const cleanedBindings = removeWorkspaceSlotReferences(
      mappedBindings,
      device.entitySlots.map((slot) => slot.id),
    );

    const saved = await lifecycle.autosave(mappedRecord, draft, 2, cleanedBindings);
    assert.equal(
      saved.status,
      "saved",
      saved.status === "storage-error" ? saved.error.stack : undefined,
    );
    for (const state of Object.values(saved.record.bindings)) {
      assert.deepEqual(state.draft.entityIdsBySlotId, {});
      assert.deepEqual(state.manualSlotIds, []);
      assert.notDeepEqual(state.published.entityIdsBySlotId, {});
    }
    const published = await lifecycle.publish(saved.record, { confirmWarnings: true, now: 3 });
    assert.equal(published.status, "published");
    assert.deepEqual(published.record.published, draft);
    for (const state of Object.values(published.record.bindings)) {
      assert.deepEqual(state.published.entityIdsBySlotId, {});
    }
  });

  test("stale tabs and concurrent lifecycle operations cannot undo a publication", async () => {
    const { store, record, repository, lifecycle, changedHome } = await fixture();
    const other = createHomeProjectRepository(store, registries);
    const [published, staleSave] = await Promise.all([
      lifecycle.publish(record, { confirmWarnings: true }),
      lifecycle.autosave(record, changedHome, 2),
    ]);
    assert.equal(published.status, "published");
    assert.equal(staleSave.status, "storage-error");
    assert.match(staleSave.error.message, /changed|stale|revision/i);
    await assert.rejects(other.replace({ ...record, draft: changedHome }, record.revision), /changed|stale|revision/i);
    assert.deepEqual(await repository.load(record.homeId), published.record);
  });

  test("autosave cannot replace published profiles through stale history, new origins, or absent-origin undo", async () => {
    const { record, lifecycle, changedHome, changedBindings } = await fixture();
    const saved = await lifecycle.autosave(record, changedHome, 2, changedBindings);
    const published = await lifecycle.publish(saved.record, { confirmWarnings: true });
    const undone = await lifecycle.autosave(published.record, record.draft, 3, record.bindings);
    assert.equal(undone.status, "saved");
    assert.deepEqual(undone.record.bindings[origin].published, changedBindings[origin].draft);
    assert.deepEqual(undone.record.bindings[origin].draft, record.bindings[origin].draft);
    const addedOrigin = "https://new-fixture-ha.test";
    const added = await lifecycle.autosave(undone.record, record.draft, 4, {
      ...undone.record.bindings, [addedOrigin]: changedBindings[origin],
    });
    assert.deepEqual(added.record.bindings[addedOrigin].published.roomAreaIds, {});
    const removed = await lifecycle.autosave(added.record, record.draft, 5, {});
    assert.equal(removed.status, "saved");
    for (const [key, state] of Object.entries(removed.record.bindings)) {
      assert.deepEqual(state.draft.roomAreaIds, {});
      assert.deepEqual(state.draft.entityIdsBySlotId, {});
      assert.deepEqual(state.published, added.record.bindings[key].published);
      assert.deepEqual(state.manualRoomIds, []);
      assert.deepEqual(state.manualSlotIds, []);
    }
  });

  test("reset restores both drafts, clears manual protections, and seed reset checks the revision", async () => {
    const { record, lifecycle, changedHome, changedBindings } = await fixture();
    changedBindings[origin].manualRoomIds = [record.draft.floors[0].rooms[0].id];
    const saved = await lifecycle.autosave(record, changedHome, 2, changedBindings);
    const reset = await lifecycle.resetDraftToPublished(saved.record, 3);
    assert.equal(reset.status, "saved");
    assert.deepEqual(reset.record.draft, record.published);
    for (const [key, state] of Object.entries(reset.record.bindings)) {
      assert.deepEqual(state.draft, record.bindings[key].published);
      assert.deepEqual(state.manualRoomIds, []);
      assert.deepEqual(state.manualSlotIds, []);
    }
    assert.equal((await lifecycle.resetToSeed(record, 4)).status, "storage-error");
    const seeded = await lifecycle.resetToSeed(reset.record, 5);
    assert.equal(seeded.status, "saved");
    assert.equal(seeded.record.revision, reset.record.revision + 1);
    assert.deepEqual(seeded.record.bindings, {});
  });

  test("publication blocks structural binding errors but accepts empty profiles and confirmed runtime warnings", async () => {
    const { record, repository, lifecycle } = await fixture();
    const invalid = structuredClone(record);
    invalid.bindings[origin].draft.roomAreaIds["unknown-room"] = "fixture-area";
    const blocked = await lifecycle.publish(invalid, { confirmWarnings: true });
    assert.equal(blocked.status, "blocked");
    assert.ok(blocked.errors.some((entry) => entry.path.includes("bindings")));
    assert.deepEqual(await repository.load(record.homeId), record);
    const warning = { code: "binding.offline", path: "bindings", severity: "warning", message: "Home Assistant is offline." };
    assert.equal((await lifecycle.publish(record, { bindingIssues: [warning] })).status, "confirmation-required");
    const empty = structuredClone(record);
    for (const state of Object.values(empty.bindings)) state.draft.roomAreaIds = {};
    const published = await lifecycle.publish(empty, { bindingIssues: [warning], confirmWarnings: true });
    assert.equal(published.status, "published");
    assert.deepEqual(published.record.bindings[origin].published.roomAreaIds, {});
  });

  test("V1 reload preserves both project snapshots and default exports exclude private bindings", async () => {
    const { record, store, lifecycle, repository, changedHome } = await fixture();
    const v1 = { ...record, draft: changedHome };
    delete v1.revision;
    delete v1.bindings;
    await store.write(record.homeId, JSON.stringify(v1));
    const loaded = await lifecycle.load();
    assert.equal(loaded.record.revision, 0);
    assert.deepEqual(loaded.record.draft, changedHome);
    assert.deepEqual(loaded.record.published, record.published);
    assert.deepEqual(loaded.record.bindings, {});
    await repository.replace(record);
    const exported = JSON.parse(lifecycle.exportRecord(record));
    assert.equal("bindings" in exported, false);
    assert.equal("revision" in exported, false);
    assert.equal(JSON.stringify(exported).includes("fixture-published-area"), false);
    assert.equal(parseHomeProjectRecord(JSON.stringify(exported), registries).valid, true);
    assert.equal(await lifecycle.exportStoredRaw(), serializeHomeProjectRecord(record));
  });

  test("memory CAS compares exact raw content and handles deletion", async () => {
    const store = createMemoryProjectRecordStore({ home: "first" });
    assert.equal(await store.compareAndSwap("home", "stale", "next"), false);
    const results = await Promise.all([store.compareAndSwap("home", "first", "winner"), store.compareAndSwap("home", "first", "loser")]);
    assert.deepEqual(results, [true, false]);
    assert.equal(await store.compareAndSwap("home", "winner", null), true);
    assert.equal(store.snapshot("home"), null);
  });

  test("native CAS rechecks inside one readwrite transaction and serializes competing stores", async () => {
    const db = transactionalIndexedDb();
    const store = createIndexedDbProjectRecordStore(db);
    await store.write("home", "first");
    const start = db.transactions.length;
    assert.equal(await store.compareAndSwap("home", "first", "next"), true);
    assert.equal(db.transactions.length, start + 1);
    assert.equal(db.transactions[start].mode, "readwrite");
    const other = createIndexedDbProjectRecordStore(db);
    assert.deepEqual(await Promise.all([store.compareAndSwap("home", "next", "winner"), other.compareAndSwap("home", "next", "loser")]), [true, false]);
    assert.equal(await store.read("home"), "winner");
    assert.equal(await store.compareAndSwap("home", "winner", null), true);
    assert.equal(await store.read("home"), null);
  });

  for (const fault of [
    { kind: "get", count: 1, type: "error" },
    { kind: "put", type: "error" },
    { kind: "get", count: 2, type: "error" },
    { kind: "get", count: 2, type: "corrupt" },
    { kind: "get", count: 2, type: "throw" },
  ]) {
    test(`native publication aborts and preserves both snapshots on ${JSON.stringify(fault)}`, async () => {
      const db = transactionalIndexedDb();
      const { record, store, lifecycle, changedHome, changedBindings } = await fixture(createIndexedDbProjectRecordStore(db));
      const saved = await lifecycle.autosave(record, changedHome, 2, changedBindings);
      const before = await store.read(record.homeId);
      db.fail(fault);
      const result = await lifecycle.publish(saved.record, { confirmWarnings: true });
      assert.equal(result.status, "storage-error");
      assert.equal(await store.read(record.homeId), before);
    });
  }

  test("simultaneous initialization keeps revision zero and never replaces the winner", async () => {
    const seed = structuredClone(ownerHomeProject);
    const store = createMemoryProjectRecordStore();
    const left = createHomeProjectRepository(store, registries);
    const right = createHomeProjectRepository(store, registries);
    const results = await Promise.all([left.loadOrCreate(seed, 1), right.loadOrCreate(seed, 2)]);
    assert.deepEqual(results[0].record, results[1].record);
    assert.equal(results[0].record.revision, 0);
  });

  test("a verification failure cannot roll back a later writer to stale lastGood data", async () => {
    const backing = createMemoryProjectRecordStore();
    let verificationFault = false;
    let winner;
    const store = {
      ...backing,
      compareAndSwap: async (homeId, expected, next) => {
        const swapped = await backing.compareAndSwap(homeId, expected, next);
        if (verificationFault && swapped && next !== null) {
          verificationFault = false;
          winner = serializeHomeProjectRecord({ ...JSON.parse(next), revision: JSON.parse(next).revision + 1, draftUpdatedAt: 999 });
          await backing.write(homeId, winner);
        }
        return swapped;
      },
    };
    const { record, repository } = await fixture(store);
    verificationFault = true;
    await assert.rejects(repository.replace({ ...record, draftUpdatedAt: 2 }, record.revision), /verification|changed/i);
    assert.equal(await backing.read(record.homeId), winner);
  });

  for (const cas of [false, true]) {
    test(`reread failure restores the exact preceding pair with ${cas ? "CAS" : "queued fallback"}`, async () => {
      const backing = createMemoryProjectRecordStore();
      let failAfterWrite = false;
      let failRead = false;
      const armReadFailure = () => {
        if (failAfterWrite) { failAfterWrite = false; failRead = true; }
      };
      const store = {
        read: async (homeId) => {
          if (failRead) { failRead = false; throw new Error("synthetic reread failure"); }
          return backing.read(homeId);
        },
        write: async (homeId, raw) => { await backing.write(homeId, raw); armReadFailure(); },
        delete: backing.delete,
        ...(cas ? {
          compareAndSwap: async (...args) => {
            const swapped = await backing.compareAndSwap(...args);
            if (swapped) armReadFailure();
            return swapped;
          },
        } : {}),
      };
      const { record, lifecycle, changedHome, changedBindings } = await fixture(store);
      const saved = await lifecycle.autosave(record, changedHome, 2, changedBindings);
      // Simulate a later valid record unseen by this repository's load path.
      const preceding = serializeHomeProjectRecord({ ...saved.record, draftUpdatedAt: 9 });
      await backing.write(record.homeId, preceding);
      failAfterWrite = true;
      const result = await lifecycle.publish(saved.record, { confirmWarnings: true });
      assert.equal(result.status, "storage-error");
      assert.match(result.error.message, /reread/);
      assert.equal(await backing.read(record.homeId), preceding);
    });
  }

  test("queued fallback does not roll back a different record observed at verification", async () => {
    const backing = createMemoryProjectRecordStore();
    let competing;
    const store = {
      read: backing.read,
      write: async (homeId, raw) => { await backing.write(homeId, competing ?? raw); },
      delete: backing.delete,
    };
    const { record, repository } = await fixture(store);
    competing = serializeHomeProjectRecord({ ...record, revision: 2, draftUpdatedAt: 999 });
    await assert.rejects(repository.replace({ ...record, draftUpdatedAt: 2 }, record.revision), /verification/);
    assert.equal(await backing.read(record.homeId), competing);
  });

  test("native initial-write and deletion readback failures abort without creating or removing records", async () => {
    const db = transactionalIndexedDb();
    const store = createIndexedDbProjectRecordStore(db);
    db.fail({ kind: "get", count: 2, type: "corrupt" });
    await assert.rejects(store.compareAndSwap("home", null, "first"), /verification/);
    assert.equal(await store.read("home"), null);
    await store.write("home", "first");
    db.fail({ kind: "get", count: 2, type: "error" });
    await assert.rejects(store.compareAndSwap("home", "first", null), /request error/);
    assert.equal(await store.read("home"), "first");
  });

  for (const raw of ["{not-json", '{"schemaVersion":999}']) {
    test(`explicit recovery replaces corrupt/unsupported storage without weakening normal reset: ${raw}`, async () => {
      const { record, store, lifecycle, seed } = await fixture();
      await store.write(record.homeId, raw);
      const loaded = await lifecycle.load();
      assert.equal(loaded.status, "recovery");
      assert.equal((await lifecycle.resetToSeed(loaded.record, 2)).status, "storage-error");
      assert.equal(await store.read(record.homeId), raw);
      const recovered = await lifecycle.recoverToSeed(loaded.record, loaded.raw, 3);
      assert.equal(recovered.status, "saved");
      assert.deepEqual(recovered.record.draft, seed);
      assert.deepEqual(recovered.record.published, seed);
      assert.deepEqual(recovered.record.bindings, {});
      assert.equal(recovered.record.draftUpdatedAt, 3);
      const reloaded = await lifecycle.load();
      assert.equal(reloaded.status, "ready");
      assert.deepEqual(reloaded.record, recovered.record);
      // A tab opened before corruption must not regain write authority after
      // recovery, even if it still holds the original revision-zero seed.
      const staleSave = await lifecycle.autosave(record, record.draft, 4);
      assert.equal(staleSave.status, "storage-error");
      assert.match(staleSave.error.message, /changed/);
      assert.deepEqual((await lifecycle.load()).record, recovered.record);
    });
  }

  test("exact-raw recovery rejects a competing tab inside CAS and retains its complete record", async () => {
    const backing = createMemoryProjectRecordStore();
    let winner;
    const store = {
      ...backing,
      compareAndSwap: async (homeId, expected, next) => {
        if (winner) await backing.write(homeId, winner);
        return backing.compareAndSwap(homeId, expected, next);
      },
    };
    const { record, lifecycle } = await fixture(store);
    const raw = "{corrupt";
    await backing.write(record.homeId, raw);
    const loaded = await lifecycle.load();
    winner = serializeHomeProjectRecord({ ...record, revision: 3, draftUpdatedAt: 999 });
    const recovered = await lifecycle.recoverToSeed(loaded.record, loaded.raw, 4);
    assert.equal(recovered.status, "storage-error");
    assert.match(recovered.error.message, /changed/);
    assert.equal(await backing.read(record.homeId), winner);
  });

  test("recovery removes only unavailable scene items and their private binding references", async () => {
    const { record, store, lifecycle } = await fixture();
    const damaged = structuredClone(record);
    const furnishing = damaged.draft.sceneItems.find((item) => item.id === "sectional-sofa");
    const device = damaged.draft.sceneItems.find((item) => item.id === "primary-bedroom-pendant");
    assert.ok(furnishing);
    assert.ok(device);
    for (const project of [damaged.draft, damaged.published]) {
      // This model still exists, but only as a device. Recovery must delete the
      // old furnishing instead of converting it at runtime.
      project.sceneItems.find((item) => item.id === furnishing.id).modelId = "retired-furnishing";
      project.sceneItems.find((item) => item.id === device.id).modelId = "retired-device";
    }
    const slotIds = device.entitySlots.map((slot) => slot.id);
    for (const state of Object.values(damaged.bindings)) {
      for (const profile of [state.draft, state.published]) {
        profile.roomAreaIds["primary-bedroom"] = "fixture-bedroom-area";
        profile.entityIdsBySlotId = {
          ...profile.entityIdsBySlotId,
          ...Object.fromEntries(device.entitySlots.map((slot, index) => [
            slot.id,
            `${slot.compatibleDomains[0]}.retired_${index}`,
          ])),
        };
      }
      state.manualSlotIds = slotIds;
    }
    const raw = serializeHomeProjectRecord(damaged);
    await store.write(record.homeId, raw);

    const loaded = await lifecycle.load();
    assert.equal(loaded.status, "recovery");
    assert.ok(loaded.issues.some((issue) => issue.code === "project.model-missing"));
    const recovered = await lifecycle.recoverWithoutMissingSceneItems(loaded.record, loaded.raw);
    assert.equal(
      recovered.status,
      "saved",
      recovered.status === "storage-error" ? recovered.error.stack : undefined,
    );
    for (const project of [recovered.record.draft, recovered.record.published]) {
      assert.equal(project.sceneItems.some((item) => item.id === furnishing.id), false);
      assert.equal(project.sceneItems.some((item) => item.id === device.id), false);
      assert.ok(project.sceneItems.some((item) => item.id === "open-plan-living-dining-table"));
      assert.ok(project.sceneItems.some((item) => item.id === "open-plan-living-dining-sideboard"));
    }
    for (const state of Object.values(recovered.record.bindings)) {
      assert.equal(slotIds.some((slotId) => slotId in state.draft.entityIdsBySlotId), false);
      assert.equal(slotIds.some((slotId) => slotId in state.published.entityIdsBySlotId), false);
      assert.equal(slotIds.some((slotId) => state.manualSlotIds.includes(slotId)), false);
    }
    assert.equal(recovered.record.draftUpdatedAt, damaged.draftUpdatedAt);
    assert.equal(recovered.record.publishedAt, damaged.publishedAt);
    assert.ok(recovered.record.revision > damaged.revision);
    assert.deepEqual(await lifecycle.load(), {
      status: "ready",
      record: recovered.record,
      source: "indexeddb",
    });
  });

  test("native recovery preserves rejected raw if transaction readback fails", async () => {
    const db = transactionalIndexedDb();
    const { record, store, lifecycle } = await fixture(createIndexedDbProjectRecordStore(db));
    const raw = "{corrupt";
    await store.write(record.homeId, raw);
    const loaded = await lifecycle.load();
    db.fail({ kind: "get", count: 2, type: "error" });
    const recovered = await lifecycle.recoverToSeed(loaded.record, loaded.raw, 4);
    assert.equal(recovered.status, "storage-error");
    assert.equal(await store.read(record.homeId), raw);
  });
});
