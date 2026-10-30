import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { wallExteriorNormal } = await load(
    "/packages/engine/src/architecture-geometry/wall-coordinate-frame.ts",
  );
  // A 4 x 4 m building with a 4 x 2 m outdoor platform on its south side (z 4 to 6).
  const floor = {
    coordinates: { metersPerPlanUnit: 1, origin: [0, 0], scaleBasis: "measured" },
    footprint: [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ],
    outdoorPlatforms: [
      {
        id: "terrace",
        polygon: [
          [0, 4],
          [4, 4],
          [4, 6],
          [0, 6],
        ],
        finish: { kind: "preset", preset: "travertine" },
        defaultEdge: { kind: "open" },
        edges: [],
      },
    ],
    walls: [],
    wallJunctions: [],
  };
  const wall = (from, to, classification = "exterior") => ({
    id: "w",
    from,
    to,
    classification,
    thicknessMeters: 0.15,
  });

  test("a house wall still faces away from the building", () => {
    const normal = wallExteriorNormal(wall([0, 0], [4, 0]), floor);
    assert.deepEqual(
      normal.map((v) => Math.round(v) + 0),
      [0, -1],
    );
  });

  test("a house wall that borders the platform keeps facing the platform side", () => {
    const normal = wallExteriorNormal(wall([0, 4], [4, 4]), floor);
    assert.deepEqual(
      normal.map((v) => Math.abs(Math.round(v))),
      [0, 1],
    );
    assert.ok(normal[1] > 0, "faces south, away from the building");
  });

  test("a free-standing wall on a platform faces away from the platform", () => {
    const side = wallExteriorNormal(wall([0, 4.5], [0, 5.5]), floor);
    assert.deepEqual(
      side.map((v) => Math.round(v) + 0),
      [-1, 0],
    );
    const east = wallExteriorNormal(wall([4, 4.5], [4, 5.5]), floor);
    assert.deepEqual(
      east.map((v) => Math.round(v) + 0),
      [1, 0],
    );
    const front = wallExteriorNormal(wall([1, 5.95], [3, 5.95]), floor);
    assert.deepEqual(
      front.map((v) => Math.round(v) + 0),
      [0, 1],
    );
  });

  test("walls away from both the building and the platform, and interior walls, do not fade", () => {
    assert.equal(wallExteriorNormal(wall([10, 10], [10, 12]), floor), null);
    assert.equal(wallExteriorNormal(wall([0, 4.5], [0, 5.5], "interior"), floor), null);
    assert.equal(wallExteriorNormal(wall([2, 5], [2, 5.5]), floor), null);
  });
});
