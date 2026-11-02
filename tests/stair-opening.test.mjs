import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { deriveStairFlight, stairOpening, deriveStairApertures } = await load(
    "/packages/engine/src/stairs/flight-geometry.ts",
  );
  const { makeStairProject } = await load("/tests/fixtures/multiple-floors.ts");
  const area = (polygon) =>
    Math.abs(
      polygon.reduce((sum, a, index) => {
        const b = polygon[(index + 1) % polygon.length];
        return sum + a[0] * b[1] - b[0] * a[1];
      }, 0),
    ) / 2;
  const lShaped = (lowerRunMeters, ceilingHeightMeters) => {
    const project = makeStairProject();
    project.floors = project.floors.map((floor) =>
      floor.id === "ground" ? { ...floor, defaultCeilingHeightMeters: ceilingHeightMeters } : floor,
    );
    const { runMeters: _run, ...stair } = project.stairs[0];
    project.stairs = [
      { ...stair, shape: "l-shaped", lowerRunMeters, upperRunMeters: 1.5, turn: "left" },
    ];
    return { project, flight: deriveStairFlight(project, project.stairs[0]) };
  };

  test("an L-shaped stair with a low first run cuts its opening only where there is headroom", () => {
    const low = lShaped(0.6, 3.5);
    assert.ok(low.flight);
    const opening = stairOpening(low.project, low.flight);
    assert.equal(opening.length, 4, "the opening is a plain rectangle");
    assert.ok(area(opening) < area(low.flight.footprint) - 0.5, "it leaves the first run uncut");
    const apertures = deriveStairApertures(low.project);
    assert.deepEqual(apertures.map((aperture) => aperture.surface).sort(), ["ceiling", "floor"]);
    for (const aperture of apertures) assert.deepEqual(aperture.polygon, opening);
  });

  test("a stair whose first run climbs close to the ceiling keeps its whole footprint", () => {
    for (const [lowerRunMeters, ceilingHeightMeters] of [
      [3, 3.5],
      [0.6, 2.55],
    ]) {
      const { project, flight } = lShaped(lowerRunMeters, ceilingHeightMeters);
      assert.ok(flight);
      assert.ok(Math.abs(area(stairOpening(project, flight)) - area(flight.footprint)) < 1e-9);
    }
  });
});
