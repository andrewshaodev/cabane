import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const { prepareWalkColliders } = await load(
    "/packages/engine/src/navigation/prepared-walk-colliders.ts",
  );
  const { deriveWalkColliders } = await load("/packages/engine/src/navigation/walk-colliders.ts");
  const { prepareBuildingWalk, moveBuildingWalker } = await load(
    "/packages/engine/src/stairs/stair-navigation.ts",
  );
  const { makeStairProject } = await load("/tests/fixtures/multiple-floors.ts");
  test("prepared collision matches fresh geometry, invalidating mutable doors and furniture", () => {
    const floor = makeStairProject().floors[0],
      get = prepareWalkColliders(floor),
      open = new Set(),
      furniture = [];
    const original = get(open, furniture);
    assert.deepEqual(original, deriveWalkColliders(floor, open, furniture));
    assert.equal(get(new Set(), []), original);
    open.add(floor.openings[0]?.id ?? "door");
    assert.deepEqual(get(open, furniture), deriveWalkColliders(floor, open, furniture));
    assert.notEqual(get(open, furniture), original);
    furniture.push({ kind: "box", id: "moving-item", minX: 1, maxX: 2, minZ: 1, maxZ: 2 });
    const before = get(open, furniture);
    furniture[0].minX = 0.5;
    assert.deepEqual(get(open, furniture), deriveWalkColliders(floor, open, furniture));
    assert.notEqual(get(open, furniture), before);
    open.clear();
    furniture.length = 0;
    assert.deepEqual(get(open, furniture), original);
  });
  test("prepared stairs and collision replay the same ascent, descent and landing frames", () => {
    const building = makeStairProject(),
      prepared = prepareBuildingWalk(building),
      open = new Set();
    let expected = { x: 4, z: 1.4, floorId: "ground", elevation: 0 },
      actual = { ...expected };
    for (const direction of [1, -1])
      for (let i = 0; i < 43; i++) {
        const movement = { x: 0, z: 0.1 * direction };
        expected = moveBuildingWalker(building, expected, movement, open);
        actual = moveBuildingWalker(building, actual, movement, open, [], prepared);
        assert.deepEqual(actual, expected);
      }
    building.floors[0].footprint[0][0] -= 0.1;
    const revised = prepareBuildingWalk(building);
    assert.deepEqual(
      moveBuildingWalker(building, actual, { x: 0.02, z: 0 }, open, [], revised),
      moveBuildingWalker(building, actual, { x: 0.02, z: 0 }, open),
    );
  });
});
