import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const api = await load("/packages/engine/src/index.ts");
  const { makeThreeFloorProject } = await load("/tests/fixtures/multiple-floors.ts");
  test("adding creates an empty top level, renaming does not change identity", () => {
    const initial = { project: makeThreeFloorProject(), bindings: {} };
    const added = api.addTopFloor(initial, "third");
    assert.equal(added.project.floors.length, 4);
    assert.deepEqual(added.project.floors[3].footprint, []);
    assert.deepEqual(added.project.floors[3].walls, []);
    assert.equal(added.project.floors[3].floorToFloorHeightMeters, 2.6);
    assert.equal(api.renameFloor(added, "first", " Bedrooms ").project.floors[1].name, "Bedrooms");
    assert.throws(() => api.renameFloor(added, "first", " "), /name/);
  });
  test("top removal and private draft changes undo together; ground cannot be removed", () => {
    const initial = { project: makeThreeFloorProject(), bindings: {} };
    const profile = {
      schemaVersion: 1,
      homeId: initial.project.home.id,
      roomAreaIds: { "second-demo-room": "synthetic-area" },
      entityIdsBySlotId: {},
    };
    initial.bindings["https://synthetic.invalid"] = {
      draft: profile,
      published: profile,
      manualRoomIds: ["second-demo-room"],
      manualSlotIds: [],
    };
    const removed = api.removeTopFloor(initial);
    assert.deepEqual(removed.bindings["https://synthetic.invalid"].draft.roomAreaIds, {});
    assert.deepEqual(removed.bindings["https://synthetic.invalid"].published, profile);
    const history = api.commitWorkspaceSnapshot(api.createWorkspaceHistory(initial), removed);
    assert.deepEqual(api.undoWorkspaceHistory(history).present, initial);
    assert.throws(() => api.removeTopFloor(api.removeTopFloor(removed)), /ground floor/);
  });
});
