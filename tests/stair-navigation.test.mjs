import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
await withModules(async load => {
  const api = await load("/packages/engine/src/stairs/index.ts");
  const { makeStairProject } = await load("/tests/fixtures/multiple-floors.ts");
  test("walks continuously up and down a flight, changing floors only at a landing", () => {
    const project = makeStairProject();
    let pose = { x: 4, z: 1.4, floorId: "ground", elevation: 0 };
    for (let i = 0; i < 42; i++) {
      const next = api.moveBuildingWalker(project, pose, {x:0,z:0.1}, new Set());
      assert.ok(Math.abs(next.elevation - pose.elevation) < 0.07);
      pose = next;
    }
    assert.equal(pose.floorId, "first"); assert.equal(pose.elevation, 2.6);
    for (let i = 0; i < 43; i++) pose = api.moveBuildingWalker(project, pose, {x:0,z:-0.1}, new Set());
    assert.equal(pose.floorId, "ground"); assert.equal(pose.elevation, 0);
  });
  test("uses an explicit walk point and rejects unsafe positions", () => {
    const project = makeStairProject();
    const pose = api.safeBuildingSpawn(project, "first", [2, 2]);
    assert.ok(pose);
    assert.equal(pose.x, 2);
    assert.equal(pose.z, 2);
    assert.equal(pose.floorId, "first");
    assert.equal(pose.elevation, 2.6);
    assert.equal(api.safeBuildingSpawn(project, "first", [4, 3]), null);
    assert.equal(api.safeBuildingSpawn(project, "first", [-20, -20]), null);
  });
  test("guards flight sides, upper apertures, and unsupported floor edges", () => {
    const project = makeStairProject();
    const upper = { x: 3.3, z: 3, floorId: "first", elevation: 2.6 };
    assert.deepEqual(api.moveBuildingWalker(project, upper, {x:0.2,z:0}, new Set()), upper);
    const flight = { x: 4.35, z: 3, floorId: "ground", elevation: .975, stairId: "ground-stairs" };
    assert.deepEqual(api.moveBuildingWalker(project, flight, {x:.1,z:0}, new Set()), flight);
    assert.ok(api.safeBuildingSpawn(project, "first"));
    assert.equal(api.safeBuildingSpawn(project, "missing"), null);
  });
});
