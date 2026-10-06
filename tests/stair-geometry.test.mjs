import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const api = await load("/packages/engine/src/stairs/index.ts");
  const { makeStairProject } = await load("/tests/fixtures/multiple-floors.ts");
  test("a flight derives rise, landings, and paired apertures from the adjacent floors", () => {
    const project = makeStairProject();
    const flight = api.deriveStairFlight(project, project.stairs[0]);
    assert.equal(flight.riseMeters, 2.6);
    assert.equal(flight.baseElevationMeters, 0);
    assert.equal(flight.runMeters, 4);
    assert.deepEqual(api.validateStairs(project), []);
    assert.deepEqual(api.deriveStairApertures(project).map(x => [x.floorId, x.surface]), [["ground","ceiling"],["first","floor"]]);
    project.stairs = [];
    assert.deepEqual(api.deriveStairApertures(project), []);
  });
  test("allows steep stairs and advises on unsupported landings", () => {
    const project = makeStairProject();
    project.stairs[0].runMeters = 1;
    assert.equal(api.validateStairs(project).some(x => x.code === "stair.slope"), false);
    project.stairs[0].runMeters = 4;
    project.stairs[0].at = [4,7];
    assert.equal(api.validateStairs(project).find(x => x.code === "stair.landing").severity, "warning");
    project.stairs[0].upperFloorId = "second";
    assert.equal(api.deriveStairFlight(project, project.stairs[0]), null);
  });
});
