import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async load => {
  const { copyWorkspaceRecord, createEmptyHomeProject, createSeedProjectRecord } = await load("/packages/engine/src/home-project/index.ts");
  test("workspace copies rewrite only home identity and isolate private mappings", () => {
    const project = createEmptyHomeProject("source", "Original");
    project.floors[0].rooms.push({ id: "room", name: "Room", polygon: [], accent: "#ffffff" });
    const source = createSeedProjectRecord(project);
    source.revision = 8;
    source.bindings = { "https://fixture.test": {
      draft: { schemaVersion: 1, homeId: "source", roomAreaIds: { room: "fixture-area" }, entityIdsBySlotId: {} },
      published: { schemaVersion: 1, homeId: "source", roomAreaIds: {}, entityIdsBySlotId: {} },
      manualRoomIds: ["room"], manualSlotIds: [],
    } };
    const before = structuredClone(source);
    const copy = copyWorkspaceRecord(source, "copy", "Second home", 123);
    assert.equal(copy.homeId, "copy");
    assert.equal(copy.draft.home.id, "copy");
    assert.equal(copy.published.home.id, "copy");
    assert.equal(copy.draft.floors[0].rooms[0].id, "room");
    assert.equal(copy.bindings["https://fixture.test"].draft.homeId, "copy");
    assert.equal(copy.bindings["https://fixture.test"].published.homeId, "copy");
    assert.deepEqual(copy.bindings["https://fixture.test"].draft.roomAreaIds, { room: "fixture-area" });
    assert.equal(copy.revision, 0);
    assert.equal(copy.draftUpdatedAt, 123);
    assert.equal(copy.publishedAt, 123);
    copy.bindings["https://fixture.test"].draft.roomAreaIds.room = "other";
    copy.draft.home.name = "Changed";
    assert.deepEqual(source, before);
    source.publishedAt = 0;
    assert.equal(copyWorkspaceRecord(source, "blank-copy", "Copy", 456).publishedAt, 0);
  });
});
