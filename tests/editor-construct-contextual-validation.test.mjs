import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const {
    collectConstructContextualIssues,
    constructValidationTargetForPath,
    visibleConstructIssues,
  } = await load(
    "/apps/web/src/editor-preview/construct/contextual-validation.ts",
  );
  const {
    constructIssuePlanPoint,
    constructIssueVisualTargets,
    constructIssueShortLabel,
  } = await load(
    "/apps/web/src/editor-preview/construct/validation-visuals.ts",
  );

  const floor = {
    footprint: [[0, 0], [4, 0], [4, 3], [0, 3]],
    walls: [{ id: "west" }, { id: "east" }],
    wallJunctions: [{ id: "north-west", at: [0, 0], wallIds: ["west", "east"] }],
    openings: [{ id: "front-door" }],
    rooms: [{ id: "living-room" }],
    ceilings: [{ id: "living-ceiling" }],
  };
  const sceneItems = [{
    id: "pendant",
    placement: {
      kind: "ceiling",
      roomId: "living-room",
      at: [2, 1],
      dropMeters: .3,
      rotationYRadians: 0,
    },
  }];

  test("resolves stable and indexed Construct paths to actionable targets", () => {
    const input = { floor, sceneItems };
    assert.deepEqual(constructValidationTargetForPath("walls.east", input), {
      kind: "wall",
      id: "east",
    });
    assert.deepEqual(constructValidationTargetForPath("floor.openings[0].wallId", input), {
      kind: "opening",
      id: "front-door",
    });
    assert.deepEqual(constructValidationTargetForPath("rooms.living-room.name", input), {
      kind: "room",
      id: "living-room",
    });
    assert.deepEqual(constructValidationTargetForPath("/ceilings/0/heightMeters", input), {
      kind: "ceiling",
      id: "living-ceiling",
    });
    assert.deepEqual(constructValidationTargetForPath("floors[0].wallJunctions[0]", input), {
      kind: "junction",
      id: "north-west",
    });
    assert.deepEqual(constructValidationTargetForPath("sceneItems[0].placement", input), {
      kind: "scene-item",
      id: "pendant",
    });
    assert.deepEqual(constructValidationTargetForPath("floor.groundZones[0].polygon", {
      ...input,
      floor: { ...floor, groundZones: [{ id: "garden-path" }] },
    }), { kind: "floor-zone", id: "garden-path" });
    assert.equal(constructValidationTargetForPath("walls", input), undefined);
    assert.equal(constructValidationTargetForPath("walls[20]", input), undefined);
  });

  test("aggregates, enriches, deduplicates, and severity-sorts independent issues", () => {
    const duplicate = {
      code: "topology.wall-overlap",
      severity: "warning",
      path: "walls.east",
      message: "Wall overlaps another wall.",
    };
    const result = collectConstructContextualIssues({
      floor,
      sceneItems,
      topologyIssues: [
        duplicate,
        {
          code: "topology.room-name",
          severity: "error",
          path: "rooms[0].name",
          message: "Name this room.",
        },
      ],
      dependencyIssues: [
        { ...duplicate, severity: "fatal" },
        {
          code: "editor.ceiling-support-missing",
          severity: "error",
          path: "sceneItems[0].placement",
          message: "Pendant has no ceiling support.",
        },
      ],
    });

    assert.equal(result.length, 3);
    assert.deepEqual(result.map((issue) => issue.severity), ["fatal", "error", "error"]);
    assert.equal(result[0].source, "dependency");
    assert.deepEqual(result[0].target, { kind: "wall", id: "east" });
    assert.match(result[0].suggestion, /overlapping walls/i);
    assert.deepEqual(result[2].target, { kind: "scene-item", id: "pendant" });
    assert.match(result[2].suggestion, /ceiling support/i);
  });

  test("accepts enriched navigation diagnostics without importing navigation", () => {
    const navigationIssue = {
      code: "navigation.spawn-blocked",
      severity: "error",
      path: "rooms.living-room",
      message: "No collision-free spawn point exists.",
      target: { kind: "room", id: "living-room" },
      suggestion: "Create more clear floor space near the room center.",
    };
    const [result] = collectConstructContextualIssues({
      floor,
      navigationIssues: [navigationIssue],
    });

    assert.equal(result.source, "navigation");
    assert.deepEqual(result.target, navigationIssue.target);
    assert.equal(result.suggestion, navigationIssue.suggestion);
  });

  test("reports one actionable naming issue per room across topology and schema validation", () => {
    const result = collectConstructContextualIssues({
      floor: { ...floor, rooms: [{ id: "living-room" }, { id: "bedroom" }] },
      topologyIssues: [{
        code: "topology.room-name", severity: "error", path: "rooms.living-room.name",
        message: "Name every closed room before applying the floor plan.",
      }],
      projectIssues: [
        { code: "project.string", severity: "fatal", path: "floor.rooms[0].name", message: "Expected a non-empty string." },
        { code: "room.name", severity: "error", path: "floors[0].rooms[0].name", message: "Room name is required." },
        { code: "project.string", severity: "error", path: "floor.rooms[1].name", message: "Expected a non-empty string." },
        { code: "project.string", severity: "error", path: "floor.rooms[0].accent", message: "Expected a non-empty string." },
      ],
    });
    const naming = result.filter(issue => constructIssueShortLabel(issue) === "Name this room");
    assert.equal(naming.length, 2, "each unnamed room has one clear issue, including schema-only errors");
    assert.equal(naming[0].severity, "fatal", "retain the strongest blocking severity");
    assert.deepEqual(naming.map(issue => issue.target.id), ["living-room", "bedroom"]);
    assert.ok(naming.every(issue => !issue.message.includes("non-empty string")));
    assert.equal(result.length, 3, "the unrelated room accent problem must remain visible");
  });

  test("defers completion issues only in Wall, without changing the full validation list", () => {
    const issues = collectConstructContextualIssues({
      floor,
      topologyIssues: ["walls-required", "no-rooms", "incomplete-shell", "room-name", "wall-overlap"].map(code => ({
        code: `topology.${code}`, severity: "error", message: code,
        path: code === "room-name" ? "rooms.living-room.name" : "walls.east",
      })),
      projectIssues: [{ code: "room.polygon-invalid", severity: "error", path: "rooms[0].polygon", message: "Invalid polygon." }],
    });
    assert.deepEqual(visibleConstructIssues(issues, "wall").map(issue => issue.code), [
      "topology.wall-overlap", "room.polygon-invalid",
    ]);
    assert.equal(issues.length, 6, "Apply retains every blocking issue while drawing");
    for (const tool of ["select", "door", "window", "passage", "measure", null]) {
      assert.equal(visibleConstructIssues(issues, tool), issues, `restore completion issues in ${tool ?? "other modes"}`);
    }
  });

  test("maps semantic project diagnostics onto rooms and wall junctions", () => {
    const result = collectConstructContextualIssues({
      floor,
      projectIssues: [
        {
          code: "room.polygon-invalid",
          severity: "error",
          path: "floor.rooms[0].polygon",
          message: "Room polygon must be simple and have a non-zero area.",
        },
        {
          code: "wall-junction.opening-overlap",
          severity: "error",
          path: "floor.wallJunctions[0]",
          message: 'Junction overlaps opening "front-door" on wall "west".',
        },
      ],
    });

    assert.deepEqual(result.map((issue) => issue.source), ["project", "project"]);
    assert.deepEqual(result.map((issue) => issue.target), [
      { kind: "room", id: "living-room" },
      { kind: "junction", id: "north-west" },
    ]);
  });

  test("expands a junction error to every implicated scene element", () => {
    const visualFloor = {
      ...floor,
      walls: [
        { id: "west", from: [0, 0], to: [0, 3] },
        { id: "east", from: [0, 0], to: [4, 0] },
      ],
      openings: [{
        id: "front-door",
        wallId: "west",
        offsetFromWallStartPlanUnits: 0,
        widthPlanUnits: 1,
      }],
    };
    const issue = {
      code: "wall-junction.opening-overlap",
      severity: "error",
      source: "project",
      path: "floor.wallJunctions[0]",
      message: 'Junction overlaps opening "front-door" on wall "west".',
      suggestion: "Move the opening away from the corner.",
      target: { kind: "junction", id: "north-west" },
    };

    assert.deepEqual(constructIssueVisualTargets(issue, visualFloor, []), [
      { kind: "junction", id: "north-west" },
      { kind: "wall", id: "west" },
      { kind: "opening", id: "front-door" },
      { kind: "wall", id: "east" },
    ]);
    assert.deepEqual(constructIssuePlanPoint(issue, visualFloor, []), [0, 0]);
  });

  test("places an invalid room marker on its first crossing", () => {
    const issue = {
      code: "room.polygon-invalid",
      severity: "error",
      source: "project",
      path: "floor.rooms[0].polygon",
      message: "Room polygon must be simple and have a non-zero area.",
      suggestion: "Move the crossing corner.",
      target: { kind: "room", id: "living-room" },
    };
    const point = constructIssuePlanPoint(issue, {
      ...floor,
      rooms: [{ id: "living-room", polygon: [[0, 0], [3, 3], [0, 3], [2, 0]] }],
    }, []);

    assert.ok(Math.abs(point[0] - 1.2) < 1e-9);
    assert.ok(Math.abs(point[1] - 1.2) < 1e-9);
  });

  test("keeps unresolved collection-wide issues visible without inventing a target", () => {
    const [result] = collectConstructContextualIssues({
      floor,
      topologyIssues: [{
        code: "topology.incomplete-shell",
        severity: "fatal",
        path: "walls",
        message: "Two wall segments remain open.",
      }],
    });

    assert.equal(result.target, undefined);
    assert.match(result.suggestion, /Complete or remove/);
  });

  test("allows all absolute items outside exact footprint regions", () => {
    const result = collectConstructContextualIssues({
      floor: {
        ...floor,
        footprint: [[0, 0], [8, 0], [8, 3], [0, 3]],
        footprintRegions: [
          [[0, 0], [3, 0], [3, 3], [0, 3]],
          [[5, 0], [8, 0], [8, 3], [5, 3]],
        ],
      },
      sceneItems: [
        {
          id: "inside",
          placement: { kind: "absolute", at: [1, 1], elevationMeters: 0, rotationYRadians: 0 },
        },
        {
          id: "boundary",
          placement: { kind: "absolute", at: [3, 1], elevationMeters: 0, rotationYRadians: 0 },
        },
        {
          id: "between-islands",
          placement: { kind: "absolute", at: [4, 1], elevationMeters: 0, rotationYRadians: 0 },
        },
        {
          id: "outdoor-tree",
          modelId: "deciduous-tree",
          placement: { kind: "absolute", at: [4, 2], elevationMeters: 0, rotationYRadians: 0 },
        },
      ],
    });

    assert.deepEqual(result, []);
  });
});
