import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspaceSyncCoordinator } from "../apps/web/src/workspaces/workspace-sync-coordinator.ts";

function fixture() {
  let local = { metadata: { id: "home", name: "Home" }, record: { homeId: "home", revision: 1, value: "A" } };
  let remote = null;
  let version = 0;
  let cursor = null;
  const repository = { read: async () => local };
  const client = {
    get: async () => remote,
    put: async (_id, document, expected) => {
      if ((remote?.version ?? null) !== expected) throw { code: "conflict" };
      remote = { version: ++version, document }; return version;
    },
    delete: async (_id, expected) => { if (remote?.version !== expected) throw { code: "conflict" }; remote = null; version++; },
  };
  const cursors = { read: async () => cursor, write: async value => { cursor = value; }, remove: async () => { cursor = null; } };
  const coordinator = createWorkspaceSyncCoordinator({ repository, client, cursors,
    fingerprint: async entry => entry.record.value,
    serialize: entry => JSON.stringify(entry),
    restore: async document => { local = JSON.parse(document); return local; },
  });
  return { coordinator, client, get local() { return local; }, setLocal(value) { local = { ...local, record: { ...local.record, value } }; },
    get remote() { return remote; }, setRemote(value) { remote = { version: ++version, document: JSON.stringify({ ...local, record: { ...local.record, value } }) }; },
    get cursor() { return cursor; }, deleteRemote() { remote = null; version++; } };
}

test("manual save creates remote copy and sync is opt-in", async () => {
  const f = fixture();
  assert.equal((await f.coordinator.reconcile("home", "https://ha")).kind, "off");
  assert.equal((await f.coordinator.manualSave("home", "https://ha")).kind, "off");
  assert.equal(f.remote.version, 1);
  assert.equal(f.cursor.enabled, false);
  await f.coordinator.setEnabled("home", "https://ha", true);
  f.setLocal("B");
  assert.equal((await f.coordinator.reconcile("home", "https://ha")).kind, "synced");
  assert.equal(JSON.parse(f.remote.document).record.value, "B");
});

test("connection loss keeps local edits and acknowledged cursor unchanged", async () => {
  const f = fixture();
  await f.coordinator.manualSave("home", "https://ha");
  await f.coordinator.setEnabled("home", "https://ha", true);
  f.setLocal("offline edit");
  f.client.get = async () => { throw new Error("disconnected"); };
  assert.equal((await f.coordinator.reconcile("home", "https://ha")).kind, "disconnected");
  assert.equal(f.cursor.remoteVersion, 1);
  assert.equal(f.local.record.value, "offline edit");
});

test("clean remote change loads; dual change and deletion conflict", async () => {
  const f = fixture();
  await f.coordinator.manualSave("home", "https://ha");
  await f.coordinator.setEnabled("home", "https://ha", true);
  f.setRemote("C");
  assert.equal((await f.coordinator.reconcile("home", "https://ha")).kind, "synced");
  assert.equal(f.local.record.value, "C");
  f.setLocal("D"); f.setRemote("E");
  assert.equal((await f.coordinator.reconcile("home", "https://ha")).kind, "conflict");
  f.deleteRemote();
  assert.equal((await f.coordinator.reconcile("home", "https://ha")).kind, "conflict");
});

test("manual restore requires explicit conflict resolution for edited local copy", async () => {
  const f = fixture();
  await f.coordinator.manualSave("home", "https://ha");
  f.setLocal("unsaved edit");
  f.setRemote("HA edit");
  assert.equal((await f.coordinator.manualRestore("home", "https://ha")).kind, "conflict");
  assert.equal(f.local.record.value, "unsaved edit");
  assert.equal((await f.coordinator.resolveConflict("home", "https://ha", "local", f.remote.version - 1)).kind, "conflict");
  assert.equal(f.remote.version, 2);
  await f.coordinator.resolveConflict("home", "https://ha", "remote");
  assert.equal(f.local.record.value, "HA edit");
});
