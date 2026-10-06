import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const { derivePlatformLowWallFootprints } = await load(
    "/packages/engine/src/outdoor-platforms/platform-low-wall-footprints.ts",
  );
  const edge = (from, to, id) => ({
    platformId: "p",
    edgeId: id,
    from,
    to,
    configuration: { kind: "low-wall", heightMeters: 0.3 },
  });
  const near = (a, b) => assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-8, `${a} != ${b}`);
  test("adjacent low walls share a miter at right, acute and concave corners", () => {
    for (const next of [
      [2, 2],
      [1, 1],
      [3, -1],
    ]) {
      const [a, b] = derivePlatformLowWallFootprints([
        edge([0, 0], [2, 0], "a"),
        edge([2, 0], next, "b"),
      ]);
      near(a[1], b[0]);
      near(a[2], b[3]);
      assert.notEqual(a[1][0], 2, "corner is angled, not a square-ended box");
    }
  });
  test("closed loops meet at every corner in both windings", () => {
    for (const points of [
      [
        [0, 0],
        [3, 0],
        [3, 2],
        [0, 2],
      ],
      [
        [0, 2],
        [3, 2],
        [3, 0],
        [0, 0],
      ],
    ]) {
      const polygons = derivePlatformLowWallFootprints(
        points.map((p, i) => edge(p, points[(i + 1) % 4], String(i))),
      );
      polygons.forEach((p, i) => {
        near(p[1], polygons[(i + 1) % 4][0]);
        near(p[2], polygons[(i + 1) % 4][3]);
      });
    }
  });
  test("facade gaps, open edges and other platforms do not acquire corner extensions", () => {
    const a = edge([0, 0], [2, 0], "a");
    for (const b of [
      { ...edge([2, 0], [2, 2], "b"), configuration: { kind: "railing", heightMeters: 1 } },
      edge([2, 0.2], [2, 2], "b"),
      { ...edge([2, 0], [2, 2], "b"), platformId: "other" },
    ]) {
      const [polygon] = derivePlatformLowWallFootprints([a, b]);
      assert.equal(polygon[1][0], 2);
      assert.equal(polygon[2][0], 2);
    }
  });
});
