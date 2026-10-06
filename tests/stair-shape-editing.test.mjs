import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const edit = await load("/apps/web/src/editor-floors/stair-placement-geometry.ts");
  const { deriveStairFlight } = await load("/packages/engine/src/stairs/flight-geometry.ts");
  const { makeStairProject } = await load("/tests/fixtures/multiple-floors.ts");
  const base = {
    id: "shape",
    lowerFloorId: "ground",
    upperFloorId: "first",
    at: [3, 2],
    rotationYRadians: 0,
  };
  test("spiral drawing and diameter edits preserve the center in world and scaled plan coordinates", () => {
    for (const coordinates of [
      { origin: [0, 0], metersPerPlanUnit: 1 },
      { origin: [17, -9], metersPerPlanUnit: 0.25 },
    ]) {
      const stair = {
        ...base,
        shape: "spiral",
        diameterMeters: 2,
        totalTurnDegrees: 270,
        direction: "clockwise",
      };
      const placed = edit.stairFromEndpoints(stair, coordinates, { x: 3, z: 2 }, { x: 3, z: 3.5 });
      assert.equal(placed.diameterMeters, 3);
      assert.ok(Math.abs(placed.rotationYRadians + Math.PI / 2) < 1e-8);
      const resized = edit.editStairFromPoint(
        placed,
        coordinates,
        { x: 3, z: 2 },
        { x: 3, z: 3.5 },
        { x: 5, z: 2 },
        "diameter",
      );
      assert.equal(resized.diameterMeters, 4);
      assert.deepEqual(resized.at, placed.at);
      assert.equal(resized.totalTurnDegrees, 270);
    }
  });
  test("L-shaped drawing locks a perpendicular upper flight and resizes each run independently", () => {
    const coordinates = { origin: [0, 0], metersPerPlanUnit: 1 };
    const stair = {
      ...base,
      shape: "l-shaped",
      widthMeters: 1,
      lowerRunMeters: 2,
      upperRunMeters: 2,
      turn: "right",
    };
    assert.equal(typeof edit.stairFromCorner, "function");
    const placed = edit.stairFromCorner(
      stair,
      coordinates,
      { x: 3, z: 2 },
      { x: 3, z: 4.5 },
      { x: 5.5, z: 4.6 },
    );
    assert.equal(placed.lowerRunMeters, 2);
    assert.equal(placed.upperRunMeters, 2);
    const changed = edit.editStairFromPoint(
      placed,
      coordinates,
      { x: 3, z: 2 },
      { x: 5.5, z: 4.5 },
      { x: 6.5, z: 4.5 },
      "top",
    );
    assert.equal(changed.upperRunMeters, 3);
    assert.equal(changed.lowerRunMeters, 2);
  });
  test("U-shaped placement and top handle keep parallel returning flights", () => {
    const coordinates = { origin: [0, 0], metersPerPlanUnit: 1 };
    const stair = {
      ...base,
      shape: "u-shaped",
      widthMeters: 1,
      lowerRunMeters: 2,
      upperRunMeters: 2,
      turn: "right",
    };
    for (const sign of [-1, 1]) {
      const placed = edit.stairFromCorner(
        stair,
        coordinates,
        { x: 3, z: 2 },
        { x: 3, z: 4.5 },
        { x: 3 + sign, z: 2 },
      );
      assert.equal(placed.lowerRunMeters, 2);
      assert.equal(placed.upperRunMeters, 2);
      assert.equal(placed.turn, sign === 1 ? "right" : "left");
      const changed = edit.editStairFromPoint(
        placed,
        coordinates,
        { x: 3, z: 2 },
        { x: 3 + sign, z: 2 },
        { x: 3 + sign, z: 1 },
        "top",
      );
      assert.equal(changed.upperRunMeters, 3);
      assert.equal(changed.lowerRunMeters, 2);
    }
  });
  test("changing shapes keeps identity, connected floors, and lower entrance", () => {
    assert.equal(typeof edit.convertStairShape, "function");
    const project = makeStairProject();
    let stair = project.stairs[0];
    for (const shape of ["spiral", "l-shaped", "u-shaped", "straight"]) {
      stair = edit.convertStairShape(project, stair, shape);
      const f = deriveStairFlight(project, stair);
      assert.equal(stair.id, "ground-stairs");
      assert.deepEqual([stair.lowerFloorId, stair.upperFloorId], ["ground", "first"]);
      assert.ok(Math.hypot(f.startWorld[0] - 4, f.startWorld[1] - 1.5) < 1e-8);
    }
  });
});
await withModules(async (load) => {
  const { makeStairProject, emptyRegistries } = await load("/tests/fixtures/multiple-floors.ts");
  const { createSeedProjectRecord, serializeHomeProjectRecord, parseHomeProjectRecord } =
    await load("/packages/engine/src/home-project/project-record-codec.ts");
  const { publishHomeProject } = await load("/packages/engine/src/home-project/lifecycle.ts");
  const { validateHomeProject } = await load("/packages/engine/src/home-project/validation.ts");
  test("shaped staircase drafts survive storage and publish with all dimensions intact", async () => {
    const base = {
      id: "shape",
      lowerFloorId: "ground",
      upperFloorId: "first",
      at: [3, 2],
      rotationYRadians: 0,
    };
    for (const stair of [
      {
        ...base,
        shape: "u-shaped",
        widthMeters: 1,
        lowerRunMeters: 2,
        upperRunMeters: 2,
        turn: "left",
      },
      {
        ...base,
        shape: "l-shaped",
        widthMeters: 1,
        lowerRunMeters: 2,
        upperRunMeters: 2,
        turn: "right",
      },
      {
        ...base,
        at: [4, 4],
        shape: "spiral",
        diameterMeters: 2,
        totalTurnDegrees: 300,
        direction: "counterclockwise",
      },
    ]) {
      const record = createSeedProjectRecord(makeStairProject());
      record.draft = { ...record.draft, stairs: [stair] };
      const parsed = parseHomeProjectRecord(serializeHomeProjectRecord(record), emptyRegistries);
      assert.equal(parsed.valid, true, JSON.stringify(parsed.issues));
      assert.deepEqual(parsed.record.draft.stairs, [stair]);
      const writes = [];
      const result = await publishHomeProject(
        {
          validate: (draft) => validateHomeProject(draft, emptyRegistries),
          replace: async (value) => writes.push(value),
        },
        parsed.record,
      );
      assert.equal(result.status, "published", JSON.stringify(result));
      assert.equal(writes.length, 1);
      assert.deepEqual(writes[0].published.stairs, [stair]);
    }
  });
});
