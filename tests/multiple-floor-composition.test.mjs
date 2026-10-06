import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { composeHomeManifest, composeHomeProjectPreview } = await load(
    "/packages/engine/src/home-project/runtime.ts",
  );
  const { validateHomeProject } = await load("/packages/engine/src/home-project/validation.ts");
  const { makeThreeFloorProject, emptyExtensions, emptyRegistries } = await load(
    "/tests/fixtures/multiple-floors.ts",
  );
  test("retains all floors and derives room membership only within item ownership", () => {
    const project = makeThreeFloorProject();
    project.sceneItems = project.floors.map((floor) => ({
      id: `${floor.id}-sensor`,
      floorId: floor.id,
      kind: "device",
      modelId: "thermometer",
      entitySlots: [],
      size: [0.1, 0.1, 0.1],
      placement: { kind: "absolute", at: [2, 2], elevationMeters: 1, rotationYRadians: 0 },
    }));
    const manifest = composeHomeManifest(project, emptyExtensions);
    assert.deepEqual(
      manifest.floors.map((floor) => floor.id),
      ["ground", "first", "second"],
    );
    for (const floor of manifest.floors)
      assert.deepEqual(
        floor.rooms[0].devices.map((x) => x.id),
        [`${floor.id}-sensor`],
      );
  });
  test("complete synthetic floors validate together; empty drafts remain previewable", () => {
    const project = makeThreeFloorProject();
    const validation = validateHomeProject(project, emptyRegistries);
    assert.equal(validation.valid, true, JSON.stringify(validation.issues));
    project.floors[2].footprint = [];
    project.floors[2].rooms = [];
    const preview = composeHomeProjectPreview(project, emptyExtensions);
    assert.equal(preview.manifest.floors.length, 2);
    assert.equal(preview.issues[0].path, "floors[2].footprint");
    assert.equal(validateHomeProject(project, emptyRegistries).valid, false);
  });
  test("preview omissions preserve the elevation of complete upper floors", () => {
    const project = makeThreeFloorProject();
    project.floors[0].footprint = [];
    project.floors[1].footprint = [];
    const preview = composeHomeProjectPreview(project, emptyExtensions);
    assert.equal(preview.manifest.floors[0].id, "second");
    assert.equal(preview.manifest.floors[0].elevationMeters, 5.2);
  });
});
