import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const {
    snapPlanPoint,
    createFloorEditorDraft,
    createFloorEditorHistory,
    floorEditorReducer,
    deriveFloorTopology,
  } = await load("/packages/engine/src/index.ts");
  const { resolveConstructionDeletionTargets } = await load(
    "/apps/web/src/editor-preview/construct/selection-geometry.ts",
  );
  const { createConstructEditorState, constructEditorReducer } = await load(
    "/apps/web/src/editor-preview/construct/construct-controller-reducer.ts",
  );
  const { createEmptyHomeProject, parseHomeProjectSchema } = await load(
    "/packages/engine/src/index.ts",
  );
  const { projectFromEditorState } = await load("/apps/web/src/editor-preview/project-sync.ts");

  const coordinates = { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" };
  const close = (actual, expected) =>
    actual.forEach((v, i) =>
      assert.ok(Math.abs(v - expected[i]) < 1e-9, `${actual} != ${expected}`),
    );
  test("U arms align exactly at rotated, off-grid references and different zoom levels", () => {
    for (const angle of [0, 0.31, Math.PI / 2, 2.4]) {
      const at = (x, y) => [
        0.037 + x * Math.cos(angle) - y * Math.sin(angle),
        0.071 + x * Math.sin(angle) + y * Math.cos(angle),
      ];
      const walls = [
        { id: "first", from: at(0, 0), to: at(0, 3.137) },
        { id: "second", from: at(0, 3.137), to: at(4.253, 3.137) },
      ];
      for (const pixelsPerMeter of [40, 100, 220]) {
        const result = snapPlanPoint({
          candidate: at(4.253, 8 / pixelsPerMeter),
          walls,
          pixelsPerMeter,
          angleOrigin: walls[1].to,
          angleReferenceRadians: angle,
          coordinates,
        });
        assert.equal(result.kind, "alignment");
        close(result.point, at(4.253, 0));
        close(result.guideFrom, at(0, 0));
        const outside = snapPlanPoint({
          candidate: at(4.253, 30 / pixelsPerMeter),
          walls,
          pixelsPerMeter,
          angleOrigin: walls[1].to,
          angleReferenceRadians: angle,
          coordinates,
        });
        assert.notEqual(outside.kind, "alignment");
      }
    }
  });
  test("editing a rotated corner satisfies both incident edges using fixed neighbor references", () => {
    const angle = 0.37;
    const at = (x, y) => [
      x * Math.cos(angle) - y * Math.sin(angle),
      x * Math.sin(angle) + y * Math.cos(angle),
    ];
    const moving = at(4, 2.9);
    const walls = [
      { id: "top", from: at(0, 0), to: at(4, 0) },
      { id: "right", from: at(4, 0), to: moving },
      { id: "bottom", from: moving, to: at(0, 3) },
      { id: "left", from: at(0, 3), to: at(0, 0) },
    ];
    const result = snapPlanPoint({
      candidate: at(4.04, 2.95),
      walls,
      pixelsPerMeter: 100,
      movingEndpoint: moving,
      angleOrigin: at(4, 0),
    });
    assert.equal(result.kind, "alignment");
    close(result.point, at(4, 3));
  });
  test("wall attachment preserves the active angle instead of projecting the raw cursor", () => {
    for (const angle of [0, 0.37]) {
      const at = (x, y) => [
        0.037 + x * Math.cos(angle) - y * Math.sin(angle),
        0.071 + x * Math.sin(angle) + y * Math.cos(angle),
      ];
      const walls = [
        { id: "start", from: at(0, 0), to: at(6, 0) },
        { id: "opposite", from: at(0, 4.137), to: at(6, 4.137) },
      ];
      for (const pixelsPerMeter of [40, 100, 220]) {
        const result = snapPlanPoint({
          candidate: at(2.173 + 6 / pixelsPerMeter, 4.137 - 5 / pixelsPerMeter),
          walls,
          pixelsPerMeter,
          angleOrigin: at(2.173, 0),
          angleReferenceRadians: angle,
        });
        assert.equal(result.kind, "wall");
        assert.equal(result.wallId, "opposite");
        close(result.point, at(2.173, 4.137));
      }
    }
  });
  test("wall attachment keeps 45-degree directions and falls back outside the magnetic angle", () => {
    const walls = [{ id: "target", from: [0, 4], to: [10, 4] }];
    const result = snapPlanPoint({
      candidate: [4.08, 3.95],
      walls,
      pixelsPerMeter: 100,
      angleOrigin: [0, 0],
    });
    close(result.point, [4, 4]);
    const oblique = snapPlanPoint({
      candidate: [6, 3.95],
      walls,
      pixelsPerMeter: 100,
      angleOrigin: [0, 0],
    });
    close(oblique.point, [6, 4]);
    const endpoint = snapPlanPoint({
      candidate: [0.04, 3.95],
      walls,
      pixelsPerMeter: 100,
      angleOrigin: [0.15, 0],
    });
    assert.equal(endpoint.kind, "endpoint");
    close(endpoint.point, [0, 4]);
  });
  test("a rotated destination offers a perpendicular landing without an active matching ray", () => {
    const angle = 0.37;
    const at = (x, y) => [
      x * Math.cos(angle) - y * Math.sin(angle),
      x * Math.sin(angle) + y * Math.cos(angle),
    ];
    const walls = [{ id: "target", from: at(0, 4), to: at(6, 4) }];
    const result = snapPlanPoint({
      candidate: at(2.04, 3.95),
      walls,
      pixelsPerMeter: 100,
      angleOrigin: at(2, 0),
    });
    assert.equal(result.wallId, "target");
    close(result.point, at(2, 4));
  });
  test("angle attachment stays inside the finite wall and does not jump beyond the snap radius", () => {
    const walls = [{ id: "target", from: [0, 4], to: [4, 4] }];
    const outside = snapPlanPoint({
      candidate: [3.7, 3.95],
      walls,
      pixelsPerMeter: 100,
      angleOrigin: [4.02, 0],
    });
    close(outside.point, [3.7, 4]);
    const beyondReach = snapPlanPoint({
      candidate: [2.3, 3.95],
      walls,
      pixelsPerMeter: 100,
      angleOrigin: [2, 0],
    });
    close(beyondReach.point, [2.3, 4]);
  });
  const build = () => {
    const walls = [
      { id: "top", from: [0, 0], to: [9, 0] },
      { id: "right", from: [9, 0], to: [9, 3] },
      { id: "bottom", from: [9, 3], to: [0, 3] },
      { id: "left", from: [0, 3], to: [0, 0] },
      { id: "divider-a", from: [3, 0], to: [3, 3] },
      { id: "divider-b", from: [6, 0], to: [6, 3] },
    ];
    const rooms = [1.5, 4.5, 7.5].map((x, i) => ({
      id: `room-${i}`,
      name: `Room ${i}`,
      anchor: [x, 1.5],
      accent: "#c98164",
    }));
    const openings = [
      { id: "left-window", wallId: "top", offsetPlanUnits: 1 },
      { id: "middle-window", wallId: "top", offsetPlanUnits: 4 },
      { id: "right-window", wallId: "top", offsetPlanUnits: 7 },
      { id: "shared-door", wallId: "divider-a", offsetPlanUnits: 1 },
    ].map((o) => ({
      ...o,
      kind: "passage",
      variant: "rectangular",
      widthPlanUnits: 0.8,
      openingHeightMeters: 2,
      sillHeightMeters: 0,
    }));
    const topology = deriveFloorTopology({
      floorId: "floor",
      floorName: "Floor",
      coordinates,
      walls,
      rooms,
      openings,
    });
    assert.deepEqual(topology.issues, []);
    const draft = { ...createFloorEditorDraft(topology.floor), walls, rooms, openings };
    return { draft, previewFloor: topology.floor, wallRuns: topology.wallRuns };
  };
  test("room deletion trims middle source spans, preserves neighbors and openings, and undoes atomically", () => {
    const input = build();
    // Marquee can also touch the protected divider and its opening.
    const selection = [
      { kind: "room", id: "room-1" },
      { kind: "wall", id: "divider-a" },
      { kind: "opening", id: "shared-door" },
    ];
    const targets = resolveConstructionDeletionTargets({ ...input, selection });
    assert.equal(
      targets.some((t) => t.id === "divider-a" || t.id === "shared-door"),
      false,
    );
    assert.deepEqual(
      targets.filter((t) => t.kind === "wall").map((t) => t.span),
      [
        [1 / 3, 2 / 3],
        [1 / 3, 2 / 3],
      ],
    );
    let history = createFloorEditorHistory(input.draft);
    history = floorEditorReducer(history, { type: "delete-elements", targets });
    assert.equal(history.past.length, 1);
    assert.deepEqual(
      history.present.rooms.map((r) => r.id),
      ["room-0", "room-2"],
    );
    assert.equal(history.present.walls.filter((w) => w.id.startsWith("top")).length, 2);
    const rightOpening = history.present.openings.find((o) => o.id === "right-window");
    assert.equal(rightOpening.offsetPlanUnits, 1);
    assert.notEqual(rightOpening.wallId, "top");
    assert.equal(
      history.present.openings.some((o) => o.id === "middle-window"),
      false,
    );
    assert.equal(
      history.present.openings.some((o) => o.id === "shared-door"),
      true,
    );
    const derived = deriveFloorTopology({ ...history.present, floorName: "Floor" });
    assert.deepEqual(derived.floor.rooms.map((r) => r.id).sort(), ["room-0", "room-2"]);
    const after = history.present;
    history = floorEditorReducer(history, { type: "undo" });
    assert.deepEqual(history.present, input.draft);
    history = floorEditorReducer(history, { type: "redo" });
    assert.deepEqual(history.present, after);
  });
  test("wall-only deletion still removes a shared wall; selecting all rooms removes the shell", () => {
    const input = build();
    const direct = resolveConstructionDeletionTargets({
      ...input,
      selection: { kind: "wall", id: "divider-a" },
    });
    assert.ok(direct.some((t) => t.id === "divider-a"));
    assert.ok(direct.some((t) => t.id === "shared-door"));
    const targets = resolveConstructionDeletionTargets({
      ...input,
      selection: input.draft.rooms.map((r) => ({ kind: "room", id: r.id })),
    });
    const deleted = floorEditorReducer(createFloorEditorHistory(input.draft), {
      type: "delete-elements",
      targets,
    }).present;
    assert.deepEqual(deleted.walls, []);
    assert.deepEqual(deleted.openings, []);
    assert.deepEqual(deleted.rooms, []);
  });
  test("deleting the final room clears the preview and produces a saveable empty floor", async () => {
    const input = build();
    let state = createConstructEditorState(input.previewFloor);
    const targets = resolveConstructionDeletionTargets({
      ...input,
      draft: state.history.present,
      selection: input.draft.rooms.map((room) => ({ kind: "room", id: room.id })),
    });
    state = constructEditorReducer(state, { type: "delete-elements", targets });
    assert.deepEqual(state.previewFloor.rooms, []);
    assert.deepEqual(state.previewFloor.footprint, []);
    assert.deepEqual(state.previewFloor.walls, []);
    const empty = createEmptyHomeProject("test", "Test");
    empty.floors[0].id = state.previewFloor.id;
    const saved = parseHomeProjectSchema(projectFromEditorState(empty, state.previewFloor, []));
    assert.equal(saved.valid, true, JSON.stringify(saved.issues));
    state = constructEditorReducer(state, { type: "undo" });
    assert.equal(state.previewFloor.rooms.length, 3);
    state = constructEditorReducer(state, { type: "redo" });
    assert.deepEqual(state.previewFloor.rooms, []);
  });

  test("an enclosed room with only shared boundaries is not silently removed and recreated", () => {
    const walls = [
      ...[0, 3, 6, 9].map((x, i) => ({ id: `vertical-${i}`, from: [x, 0], to: [x, 9] })),
      ...[0, 3, 6, 9].map((y, i) => ({ id: `horizontal-${i}`, from: [0, y], to: [9, y] })),
    ];
    const rooms = [1.5, 4.5, 7.5].flatMap((x, i) =>
      [1.5, 4.5, 7.5].map((y, j) => ({
        id: `room-${i}-${j}`,
        name: "Room",
        accent: "#c98164",
        anchor: [x, y],
      })),
    );
    const topology = deriveFloorTopology({
      floorId: "floor",
      floorName: "Floor",
      coordinates,
      walls,
      rooms,
      openings: [],
    });
    const draft = { ...createFloorEditorDraft(topology.floor), walls, rooms };
    const targets = resolveConstructionDeletionTargets({
      draft,
      previewFloor: topology.floor,
      wallRuns: topology.wallRuns,
      selection: { kind: "room", id: "room-1-1" },
    });
    assert.deepEqual(targets, []);
    const history = createFloorEditorHistory(draft);
    assert.equal(floorEditorReducer(history, { type: "delete-elements", targets }).present, draft);
  });
});
