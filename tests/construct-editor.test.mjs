import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { assertValidLayoutFloorSpec, validateLayoutFloorSpec } = await load(
    "/packages/engine/src/home-editor/construct/layout-validation.ts",
  );
  const { deriveFloorTopology, remapWallOffsetToDerivedRun } = await load(
    "/packages/engine/src/home-editor/construct/topology.ts",
  );
  const { createFloorEditorDraft, createFloorEditorHistory, floorEditorReducer, snapPlanPoint } =
    await load("/packages/engine/src/home-editor/construct/editor-state.ts");
  const {
    activeFloorLayoutStorageKey,
    draftFloorLayoutStorageKey,
    exportFloorSpec,
    importFloorSpec,
    loadActiveFloorLayout,
    loadFloorLayoutDraft,
    saveActiveFloorLayout,
    saveFloorLayoutDraft,
  } = await load("/packages/engine/src/home-project/legacy-floor-storage.ts");
  const { reconcileRuntimeBindingProfile } = await load(
    "/packages/engine/src/home-project/legacy-floor-runtime.ts",
  );
  const { constructionMarqueeTargets, resolveConstructionDeletionTargets } = await load(
    "/apps/web/src/editor-preview/construct/selection-geometry.ts",
  );
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");

  const rectangleWalls = [
    { id: "north", from: [0, 0], to: [4, 0] },
    { id: "east", from: [4, 0], to: [4, 3] },
    { id: "south", from: [4, 3], to: [0, 3] },
    { id: "west", from: [0, 3], to: [0, 0] },
  ];
  const derive = (
    walls = rectangleWalls,
    rooms = [{ id: "living", name: "Living", accent: "#c98164", anchor: [2, 1.5] }],
  ) =>
    deriveFloorTopology({
      floorId: "floor",
      floorName: "Ground floor",
      walls,
      openings: [],
      rooms,
    });

  test("derives one validated room, footprint, exterior walls, and complete corner junctions", () => {
    const result = derive();
    assert.deepEqual(result.issues, []);
    assert.equal(result.faces.length, 1);
    assert.deepEqual(result.floor.footprint, [
      [0, 0],
      [4, 0],
      [4, 3],
      [0, 3],
    ]);
    assert.equal(result.floor.wallJunctions.length, 4);
    assert.ok(result.floor.walls.every((wall) => wall.classification === "exterior"));
    assert.deepEqual(result.floor.openings, []);
    assert.equal(assertValidLayoutFloorSpec(result.floor), result.floor);
  });

  test("allows collinear walls to meet at an endpoint without requiring an opening", () => {
    const result = derive([
      { id: "north-left", from: [0, 0], to: [2, 0] },
      { id: "north-right", from: [2, 0], to: [4, 0] },
      ...rectangleWalls.slice(1),
    ]);
    assert.deepEqual(result.issues, []);
    assert.deepEqual(result.floor.openings, []);
    assert.ok(
      result.floor.wallJunctions.some(
        (junction) => junction.at[0] === 2 && junction.at[1] === 0 && junction.wallIds.length === 2,
      ),
    );
    assert.equal(validateLayoutFloorSpec(result.floor).valid, true);
  });

  test("splits a room at a shared wall while preserving the anchored room identity", () => {
    const result = derive(
      [...rectangleWalls, { id: "divider", from: [2, 0], to: [2, 3] }],
      [{ id: "living", name: "Living", accent: "#c98164", anchor: [1, 1.5] }],
    );
    assert.equal(result.faces.length, 2);
    assert.equal(result.classifications.divider, "interior");
    assert.ok(result.floor.rooms.some((room) => room.id === "living"));
    assert.equal(result.floor.rooms.find((room) => room.id !== "living").name, "Unnamed room 1");
    assert.ok(!result.issues.some((issue) => issue.code === "topology.room-name"));
  });

  test("new room names skip existing names across floors and reserve each generated name", () => {
    const result = deriveFloorTopology({
      floorId: "floor",
      floorName: "Ground floor",
      openings: [],
      walls: [...rectangleWalls, { id: "divider", from: [2, 0], to: [2, 3] }],
      rooms: [],
      reservedRoomNames: [" unnamed ROOM 1 ", "Unnamed room 3"],
    });
    assert.deepEqual(
      result.floor.rooms.map((room) => room.name),
      ["Unnamed room 2", "Unnamed room 4"],
    );
    const existing = derive(rectangleWalls, [
      { id: "existing", name: "Unnamed room 1", accent: "#c98164", anchor: [1, 1] },
    ]);
    assert.equal(existing.floor.rooms[0].name, "Unnamed room 1");
  });

  test("deleting a wall prunes openings and junction memberships in the draft, with undo", () => {
    const floor = neutralDemoManifest.floors[0];
    const wallId = floor.openings[0].wallId;
    const otherIds = floor.walls.filter((wall) => wall.id !== wallId).map((wall) => wall.id);
    const draft = createFloorEditorDraft(floor);
    draft.junctions = [
      { id: "corner", at: [0, 0], wallIds: [wallId, otherIds[0]] },
      { id: "tee", at: [0, 1], wallIds: [wallId, otherIds[0], otherIds[1]] },
      { id: "unrelated", at: [0, 2], wallIds: [otherIds[0], otherIds[1]] },
    ];
    let history = createFloorEditorHistory(draft);
    history = floorEditorReducer(history, {
      type: "select",
      selection: { kind: "wall", id: wallId },
    });
    history = floorEditorReducer(history, { type: "delete-selection" });
    assert.ok(history.present.walls.every((wall) => wall.id !== wallId));
    assert.ok(history.present.openings.every((opening) => opening.wallId !== wallId));
    assert.deepEqual(history.present.junctions, [
      { ...draft.junctions[1], wallIds: [otherIds[0], otherIds[1]] },
      draft.junctions[2],
    ]);
    assert.equal(history.present.selection, null);
    history = floorEditorReducer(history, { type: "undo" });
    assert.deepEqual(history.present.walls, draft.walls);
    assert.deepEqual(history.present.openings, draft.openings);
    assert.deepEqual(history.present.junctions, draft.junctions);
  });

  test("deletes mixed construction targets atomically and restores them with one undo", () => {
    const floor = derive().floor;
    const draft = createFloorEditorDraft(floor);
    draft.openings = [
      {
        id: "north-door",
        kind: "passage",
        variant: "rectangular",
        wallId: "north",
        offsetPlanUnits: 1,
        widthPlanUnits: 0.8,
        openingHeightMeters: 2,
        sillHeightMeters: 0,
      },
      {
        id: "east-window",
        kind: "passage",
        variant: "rectangular",
        wallId: "east",
        offsetPlanUnits: 1,
        widthPlanUnits: 0.8,
        openingHeightMeters: 1,
        sillHeightMeters: 1,
      },
    ];
    draft.pools = [
      {
        id: "pool",
        polygon: [
          [6, 0],
          [8, 0],
          [8, 2],
          [6, 2],
        ],
      },
    ];
    let history = createFloorEditorHistory(draft);
    history = floorEditorReducer(history, {
      type: "select",
      selection: {
        kind: "multiple",
        targets: [
          { kind: "room", id: "living" },
          { kind: "wall", id: "north" },
          { kind: "opening", id: "east-window" },
          { kind: "pool", id: "pool" },
        ],
      },
    });
    const selectedDraft = history.present;
    history = floorEditorReducer(history, {
      type: "delete-elements",
      targets: history.present.selection.targets,
    });
    assert.equal(
      history.present.rooms.some((room) => room.id === "living"),
      false,
    );
    assert.equal(
      history.present.walls.some((wall) => wall.id === "north"),
      false,
    );
    assert.deepEqual(history.present.openings, []);
    assert.deepEqual(history.present.pools, []);
    assert.ok(history.present.junctions.every((junction) => !junction.wallIds.includes("north")));
    assert.equal(history.present.selection, null);
    assert.equal(history.past.length, 1);
    history = floorEditorReducer(history, { type: "undo" });
    assert.deepEqual(history.present, selectedDraft);
  });

  test("marquee hit testing includes touched architecture and expands rooms to source-wall contours", () => {
    const topology = deriveFloorTopology({
      floorId: "floor",
      floorName: "Ground floor",
      walls: [...rectangleWalls, { id: "divider", from: [2, 0], to: [2, 3] }],
      openings: [],
      rooms: [
        { id: "left", name: "Left", accent: "#c98164", anchor: [1, 1.5] },
        { id: "right", name: "Right", accent: "#92aa86", anchor: [3, 1.5] },
      ],
    });
    assert.deepEqual(topology.issues, []);
    const draft = createFloorEditorDraft(topology.floor);
    draft.openings = [
      {
        id: "north-opening",
        kind: "passage",
        variant: "rectangular",
        wallId: "north",
        offsetPlanUnits: 0.5,
        widthPlanUnits: 0.8,
        openingHeightMeters: 2,
        sillHeightMeters: 0,
      },
    ];
    draft.pools = [
      {
        id: "pool",
        polygon: [
          [0.4, 0.4],
          [0.8, 0.4],
          [0.8, 0.8],
          [0.4, 0.8],
        ],
      },
    ];
    const marquee = constructionMarqueeTargets({
      from: [-0.1, -0.1],
      to: [2.05, 1.6],
      draft,
      rooms: topology.floor.rooms,
    });
    assert.ok(marquee.some((target) => target.kind === "room" && target.id === "left"));
    assert.ok(!marquee.some((target) => target.kind === "room" && target.id === "right"));
    assert.ok(marquee.some((target) => target.kind === "wall" && target.id === "divider"));
    assert.ok(marquee.some((target) => target.kind === "opening" && target.id === "north-opening"));
    assert.ok(marquee.some((target) => target.kind === "pool" && target.id === "pool"));

    const effective = resolveConstructionDeletionTargets({
      selection: [{ kind: "room", id: "left" }],
      draft,
      previewFloor: topology.floor,
      wallRuns: topology.wallRuns,
    });
    assert.deepEqual(
      effective.filter((target) => target.kind === "wall").map((target) => target.id),
      ["north", "south", "west"],
    );
    assert.ok(
      effective.some((target) => target.kind === "opening" && target.id === "north-opening"),
    );
    assert.ok(!effective.some((target) => target.kind === "wall" && target.id === "east"));
  });

  test("resolves merged room identities in one undoable command and keeps the surviving ceiling", () => {
    const divided = deriveFloorTopology({
      floorId: "floor",
      floorName: "Ground floor",
      walls: [...rectangleWalls, { id: "divider", from: [2, 0], to: [2, 3] }],
      openings: [],
      rooms: [
        {
          id: "left-room",
          name: "Left room",
          accent: "#c98164",
          anchor: [1, 1.5],
          ceilingId: "left-ceiling",
          ceilingHeightMeters: 2.6,
        },
        {
          id: "right-room",
          name: "Right room",
          accent: "#92aa86",
          anchor: [3, 1.5],
          ceilingId: "right-ceiling",
          ceilingHeightMeters: 2.8,
        },
      ],
    });
    assert.deepEqual(divided.issues, []);
    let history = createFloorEditorHistory(createFloorEditorDraft(divided.floor));
    history = floorEditorReducer(history, {
      type: "select",
      selection: { kind: "wall", id: "divider" },
    });
    history = floorEditorReducer(history, { type: "delete-selection" });
    const merged = deriveFloorTopology({
      floorId: history.present.floorId,
      floorName: history.present.floorName,
      walls: history.present.walls,
      openings: history.present.openings,
      rooms: history.present.rooms,
    });
    assert.ok(merged.issues.some((issue) => issue.code === "topology.room-merge"));

    history = floorEditorReducer(history, {
      type: "resolve-room-merge",
      survivorId: "right-room",
      mergedRoomIds: ["left-room", "right-room"],
      anchor: [2, 1.5],
    });
    assert.deepEqual(
      history.present.rooms.map((room) => room.id),
      ["right-room"],
    );
    assert.equal(history.past.length, 2, "merge resolution is one semantic undo step");
    const resolved = deriveFloorTopology({
      floorId: history.present.floorId,
      floorName: history.present.floorName,
      walls: history.present.walls,
      openings: history.present.openings,
      rooms: history.present.rooms,
    });
    assert.equal(
      resolved.issues.some((issue) => issue.code === "topology.room-merge"),
      false,
    );
    assert.equal(resolved.floor.rooms[0].id, "right-room");
    assert.deepEqual(resolved.floor.ceilings, [
      {
        id: "right-ceiling",
        kind: "flat",
        roomIds: ["right-room"],
        heightMeters: 2.8,
      },
    ]);
  });

  test("derives disconnected closed rooms without adding a synthetic connection", () => {
    const island = deriveFloorTopology({
      floorId: "floor",
      floorName: "Floor",
      openings: [],
      rooms: [
        { id: "house", name: "House", accent: "#c98164", anchor: [2, 1.5] },
        { id: "studio", name: "Studio", accent: "#92aa86", anchor: [8.5, 0.5] },
      ],
      walls: [
        ...rectangleWalls,
        { id: "i-n", from: [8, 0], to: [9, 0] },
        { id: "i-e", from: [9, 0], to: [9, 1] },
        { id: "i-s", from: [9, 1], to: [8, 1] },
        { id: "i-w", from: [8, 1], to: [8, 0] },
      ],
    });
    assert.deepEqual(island.issues, []);
    assert.equal(island.faces.length, 2);
    assert.deepEqual(
      island.floor.rooms.map((room) => room.id),
      ["house", "studio"],
    );
    assert.deepEqual(island.floor.footprint, [
      [0, 0],
      [9, 0],
      [9, 1],
      [4, 3],
      [0, 3],
    ]);
    assert.deepEqual(island.floor.footprintRegions, [
      [
        [0, 0],
        [4, 0],
        [4, 3],
        [0, 3],
      ],
      [
        [8, 0],
        [9, 0],
        [9, 1],
        [8, 1],
      ],
    ]);
    assert.equal(island.floor.walls.length, 8, "closed islands retain only their authored walls");
    assert.equal(validateLayoutFloorSpec(island.floor).valid, true);
  });

  test("rejects collinear overlaps but accepts separator walls", () => {
    const overlap = derive([...rectangleWalls, { id: "overlap", from: [1, 0], to: [3, 0] }]);
    assert.ok(overlap.issues.some((issue) => issue.code === "topology.wall-overlap"));
    const dangling = derive([...rectangleWalls, { id: "partial", from: [2, 0], to: [2, 1] }]);
    assert.deepEqual(dangling.issues, []);
    assert.equal(dangling.floor.walls.length, 5);
    assert.equal(
      validateLayoutFloorSpec(dangling.floor).valid,
      true,
      JSON.stringify(validateLayoutFloorSpec(dangling.floor)),
    );
  });

  test("splits a partly shared source wall into homogeneous runs and remaps its opening", () => {
    const result = deriveFloorTopology({
      floorId: "floor",
      floorName: "Floor",
      walls: [
        ...rectangleWalls,
        { id: "annex-west", from: [1, 0], to: [1, -2] },
        { id: "annex-north", from: [1, -2], to: [3, -2] },
        { id: "annex-east", from: [3, -2], to: [3, 0] },
      ],
      openings: [
        {
          id: "north-window",
          wallId: "north",
          kind: "window",
          offsetPlanUnits: 3.25,
          widthPlanUnits: 0.5,
          openingHeightMeters: 1,
          sillHeightMeters: 1,
          operation: "casement",
          hingeSide: "end",
          openingSide: "left",
          variant: "plain",
          panelCount: 1,
          glazing: "clear",
        },
      ],
      rooms: [
        { id: "main", name: "Main", accent: "#c98164", anchor: [2, 1.5] },
        { id: "annex", name: "Annex", accent: "#92aa86", anchor: [2, -1] },
      ],
    });

    assert.deepEqual(result.issues, []);
    assert.deepEqual(
      result.floor.walls
        .filter((wall) => wall.id.startsWith("north"))
        .map((wall) => ({
          id: wall.id,
          from: wall.from,
          to: wall.to,
          classification: wall.classification,
        })),
      [
        { id: "north", from: [0, 0], to: [1, 0], classification: "exterior" },
        { id: "north--split-2", from: [1, 0], to: [3, 0], classification: "interior" },
        { id: "north--split-3", from: [3, 0], to: [4, 0], classification: "exterior" },
      ],
    );
    assert.deepEqual(result.floor.openings[0], {
      id: "north-window",
      wallId: "north--split-3",
      kind: "window",
      offsetFromWallStartPlanUnits: 0.25,
      widthPlanUnits: 0.5,
      openingHeightMeters: 1,
      sillHeightMeters: 1,
      operation: "casement",
      hingeSide: "end",
      openingSide: "left",
      variant: "plain",
      panelCount: 1,
      glazing: "clear",
    });
    assert.deepEqual(remapWallOffsetToDerivedRun(result.wallRuns, "north", 2.25), {
      wallId: "north--split-2",
      offsetFromWallStartPlanUnits: 1.25,
    });
    assert.equal(
      result.floor.walls.some((wall) => wall.id === "north" && wall.to[0] === 4),
      false,
    );
    assert.equal(validateLayoutFloorSpec(result.floor).valid, true);
  });

  test("enforces layout-only FloorSpec fields", () => {
    const floor = structuredClone(derive().floor);
    floor.rooms[0].devices.push({ id: "not-layout", model: "indoor-ac" });
    floor.openings.push({
      id: "contact-window",
      wallId: "north",
      kind: "window",
      offsetFromWallStartPlanUnits: 1,
      widthPlanUnits: 1,
      openingHeightMeters: 1.2,
      sillHeightMeters: 0.9,
      operation: "casement",
      variant: "plain",
      panelCount: 1,
      glazing: "clear",
      contactSlot: {
        id: "contact",
        compatibleDeviceClasses: ["window"],
        openState: "on",
        autoMap: "manual",
      },
    });
    const result = validateLayoutFloorSpec(floor);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((issue) => issue.code === "layout.devices"));
    assert.ok(result.issues.some((issue) => issue.code === "layout.opening-contact"));
  });

  test("uses zoom-independent endpoint priority before wall and angle/grid snapping", () => {
    const nearEndpoint = snapPlanPoint({
      candidate: [0.08, 0.03],
      walls: rectangleWalls,
      pixelsPerMeter: 100,
      pointerType: "mouse",
    });
    assert.equal(nearEndpoint.kind, "endpoint");
    assert.deepEqual(nearEndpoint.point, [0, 0]);
    const stickyCorner = snapPlanPoint({
      candidate: [0.2, 0],
      walls: rectangleWalls,
      pixelsPerMeter: 82,
      pointerType: "mouse",
    });
    assert.equal(stickyCorner.kind, "endpoint");
    assert.deepEqual(stickyCorner.point, [0, 0]);
    const nearWall = snapPlanPoint({
      candidate: [2, 0.08],
      walls: rectangleWalls,
      pixelsPerMeter: 100,
      pointerType: "mouse",
    });
    assert.equal(nearWall.kind, "wall");
    assert.deepEqual(nearWall.point, [2, 0]);
    const angled = snapPlanPoint({
      candidate: [1.06, 0.05],
      walls: [],
      pixelsPerMeter: 100,
      angleOrigin: [0, 0],
    });
    assert.equal(angled.kind, "angle-grid");
    assert.deepEqual(angled.point, [1.1, 0]);
    const calibratedGrid = snapPlanPoint({
      candidate: [10.11, -1.89],
      walls: [],
      pixelsPerMeter: 100,
      coordinates: { origin: [10, -2], metersPerPlanUnit: 0.5, scaleBasis: "measured" },
    });
    assert.deepEqual(calibratedGrid.point, [10.2, -1.8]);
  });

  test("moves connected endpoints together and caps semantic undo history", () => {
    let history = createFloorEditorHistory(createFloorEditorDraft(derive().floor));
    history = floorEditorReducer(history, { type: "move-endpoint", from: [0, 0], to: [-1, 0] });
    assert.deepEqual(history.present.walls.find((wall) => wall.id === "north").from, [-1, 0]);
    assert.deepEqual(history.present.walls.find((wall) => wall.id === "west").to, [-1, 0]);
    for (let index = 0; index < 60; index += 1) {
      history = floorEditorReducer(history, { type: "set-floor-name", name: `Floor ${index}` });
    }
    assert.equal(history.past.length, 50);
    history = floorEditorReducer(history, { type: "undo" });
    assert.equal(history.present.floorName, "Floor 58");
  });

  test("preserves room floor finishes and wall colors through edit, export, and import", () => {
    const floor = structuredClone(neutralDemoManifest.floors[0]);
    floor.rooms[0].floorFinish = { kind: "solid", color: "#c8bca8" };
    floor.walls[0].exteriorColor = "#b86f58";
    floor.walls[0].faceColors = { left: "#d8d0e2", right: "#cadccb" };
    let history = createFloorEditorHistory(createFloorEditorDraft(floor));
    history = floorEditorReducer(history, {
      type: "name-room",
      roomId: "demo-room",
      name: "Renamed room",
      accent: "#f2c7a7",
      anchor: [2.4, 1.8],
    });
    history = floorEditorReducer(history, {
      type: "move-endpoint",
      from: [0, 0],
      to: [-0.2, 0],
    });
    const draft = history.present;
    assert.equal(draft.rooms[0].ceilingId, floor.ceilings[0].id);
    assert.equal(draft.rooms[0].ceilingHeightMeters, floor.ceilings[0].heightMeters);
    const result = deriveFloorTopology({
      floorId: draft.floorId,
      floorName: draft.floorName,
      walls: draft.walls,
      openings: draft.openings,
      rooms: draft.rooms,
      junctions: draft.junctions,
      defaultWallHeightMeters: draft.defaultWallHeightMeters,
      defaultCeilingHeightMeters: draft.defaultCeilingHeightMeters,
      exteriorWallThicknessMeters: draft.exteriorWallThicknessMeters,
      interiorWallThicknessMeters: draft.interiorWallThicknessMeters,
    });
    assert.deepEqual(result.issues, []);
    assert.deepEqual(result.floor.rooms[0].floorFinish, { kind: "solid", color: "#c8bca8" });
    assert.deepEqual(result.floor.ceilings, floor.ceilings);
    assert.deepEqual(result.floor.walls.find((wall) => wall.id === "north-wall").faceColors, {
      left: "#d8d0e2",
      right: "#cadccb",
    });
    assert.equal(
      result.floor.walls.find((wall) => wall.id === "north-wall").exteriorColor,
      "#b86f58",
    );
    const imported = importFloorSpec(exportFloorSpec(result.floor));
    assert.equal(imported.valid, true);
    assert.deepEqual(imported.floor.rooms[0].floorFinish, { kind: "solid", color: "#c8bca8" });
    assert.deepEqual(imported.floor.walls.find((wall) => wall.id === "north-wall").faceColors, {
      left: "#d8d0e2",
      right: "#cadccb",
    });
    assert.equal(
      imported.floor.walls.find((wall) => wall.id === "north-wall").exteriorColor,
      "#b86f58",
    );

    const records = new Map();
    const storage = {
      getItem: (key) => records.get(key) ?? null,
      setItem: (key, value) => records.set(key, value),
    };
    saveFloorLayoutDraft(storage, "surface-home", draft);
    const reloadedDraft = loadFloorLayoutDraft(storage, "surface-home", floor);
    assert.deepEqual(reloadedDraft.rooms[0].floorFinish, { kind: "solid", color: "#c8bca8" });
    assert.deepEqual(reloadedDraft.walls[0].faceColors, { left: "#d8d0e2", right: "#cadccb" });
    assert.equal(reloadedDraft.walls[0].exteriorColor, "#b86f58");

    const applied = saveActiveFloorLayout(storage, "surface-home", imported.floor);
    assert.deepEqual(applied.rooms[0].floorFinish, { kind: "solid", color: "#c8bca8" });
    assert.deepEqual(applied.walls[0].faceColors, { left: "#d8d0e2", right: "#cadccb" });
    assert.equal(applied.walls[0].exteriorColor, "#b86f58");
    const loadedActive = loadActiveFloorLayout(storage, "surface-home");
    assert.equal(loadedActive.status, "valid");
    assert.deepEqual(loadedActive.floor.rooms[0].floorFinish, { kind: "solid", color: "#c8bca8" });
    assert.deepEqual(loadedActive.floor.walls[0].faceColors, { left: "#d8d0e2", right: "#cadccb" });
    assert.equal(loadedActive.floor.walls[0].exteriorColor, "#b86f58");
  });

  test("preserves explicit door and window models through edit topology", () => {
    const floor = structuredClone(neutralDemoManifest.floors[0]);
    Object.assign(floor.openings[0], {
      operation: "sliding",
      variant: "plank",
      leafCount: 1,
    });
    Object.assign(floor.openings[1], {
      operation: "casement",
      variant: "muntined",
      panelCount: 2,
      glazing: "privacy",
      muntins: { columns: 2, rows: 3 },
    });

    const draft = createFloorEditorDraft(floor);
    assert.equal(draft.openings[0].operation, "sliding");
    assert.equal(draft.openings[0].variant, "plank");
    assert.equal(draft.openings[0].leafCount, 1);
    assert.equal(draft.openings[1].operation, "casement");
    assert.equal(draft.openings[1].variant, "muntined");
    assert.equal(draft.openings[1].panelCount, 2);
    assert.equal(draft.openings[1].glazing, "privacy");
    assert.deepEqual(draft.openings[1].muntins, { columns: 2, rows: 3 });

    const result = deriveFloorTopology({
      floorId: draft.floorId,
      floorName: draft.floorName,
      walls: draft.walls,
      openings: draft.openings,
      rooms: draft.rooms,
      junctions: draft.junctions,
      defaultWallHeightMeters: draft.defaultWallHeightMeters,
      defaultCeilingHeightMeters: draft.defaultCeilingHeightMeters,
      exteriorWallThicknessMeters: draft.exteriorWallThicknessMeters,
      interiorWallThicknessMeters: draft.interiorWallThicknessMeters,
    });
    assert.deepEqual(result.floor.openings[0], floor.openings[0]);
    assert.deepEqual(result.floor.openings[1], floor.openings[1]);
  });

  test("adds and independently configures door, window, and passage models", () => {
    let history = createFloorEditorHistory(createFloorEditorDraft(derive().floor));
    history = floorEditorReducer(history, {
      type: "add-opening",
      wallId: "north",
      kind: "door",
      offsetPlanUnits: 0.5,
    });
    const door = history.present.openings.at(-1);
    assert.equal(door.finish, "wood");
    history = floorEditorReducer(history, {
      type: "update-opening",
      opening: {
        ...door,
        operation: "sliding",
        variant: "french",
        leafCount: 2,
        finish: "white",
      },
    });
    assert.deepEqual(
      {
        operation: history.present.openings.at(-1).operation,
        variant: history.present.openings.at(-1).variant,
        leafCount: history.present.openings.at(-1).leafCount,
        finish: history.present.openings.at(-1).finish,
      },
      { operation: "sliding", variant: "french", leafCount: 2, finish: "white" },
    );

    history = floorEditorReducer(history, {
      type: "add-opening",
      wallId: "east",
      kind: "window",
      offsetPlanUnits: 0.5,
    });
    const window = history.present.openings.at(-1);
    history = floorEditorReducer(history, {
      type: "update-opening",
      opening: {
        ...window,
        variant: "muntined",
        panelCount: 2,
        glazing: "privacy",
        muntins: { columns: 2, rows: 3 },
      },
    });
    assert.equal(history.present.openings.at(-1).variant, "muntined");
    assert.deepEqual(history.present.openings.at(-1).muntins, { columns: 2, rows: 3 });

    history = floorEditorReducer(history, {
      type: "add-opening",
      wallId: "west",
      kind: "passage",
      offsetPlanUnits: 1.5,
    });
    const passage = history.present.openings.at(-1);
    history = floorEditorReducer(history, {
      type: "update-opening",
      opening: {
        ...passage,
        variant: "arched",
        archRiseMeters: 0.12,
      },
    });
    assert.equal(history.present.openings.at(-1).variant, "arched");
    assert.equal(history.present.openings.at(-1).archRiseMeters, 0.12);
  });

  test("duplicates doors, windows, and passages nearby in one undoable command", () => {
    const sources = [
      {
        id: "custom-door",
        wallId: "north",
        kind: "door",
        offsetPlanUnits: 1.6,
        widthPlanUnits: 0.7,
        openingHeightMeters: 2.1,
        sillHeightMeters: 0,
        operation: "sliding",
        variant: "plank",
        finish: "white",
        leafCount: 2,
        openingSide: "right",
        slideDirection: "end",
      },
      {
        id: "custom-window",
        wallId: "north",
        kind: "window",
        offsetPlanUnits: 1.6,
        widthPlanUnits: 0.7,
        openingHeightMeters: 1.3,
        sillHeightMeters: 1.05,
        operation: "casement",
        variant: "muntined",
        panelCount: 2,
        glazing: "privacy",
        openingSide: "right",
        hingeSide: "end",
        muntins: { columns: 3, rows: 2 },
      },
      {
        id: "custom-passage",
        wallId: "north",
        kind: "passage",
        offsetPlanUnits: 1.6,
        widthPlanUnits: 0.7,
        openingHeightMeters: 2.2,
        sillHeightMeters: 0,
        variant: "arched",
        archRiseMeters: 0.18,
      },
    ];
    for (const source of sources) {
      const draft = createFloorEditorDraft(derive().floor);
      draft.openings = [structuredClone(source)];
      const initial = createFloorEditorHistory(draft);
      const history = floorEditorReducer(initial, {
        type: "duplicate-opening",
        openingId: source.id,
      });
      assert.equal(history.present.openings.length, 2);
      assert.equal(history.past.length, 1);
      assert.deepEqual(history.present.selection, { kind: "opening", id: `${source.id}-copy` });
      const copy = history.present.openings[1];
      assert.deepEqual({ ...copy, id: source.id, offsetPlanUnits: source.offsetPlanUnits }, source);
      const gap = Math.max(
        source.offsetPlanUnits - (copy.offsetPlanUnits + copy.widthPlanUnits),
        copy.offsetPlanUnits - (source.offsetPlanUnits + source.widthPlanUnits),
      );
      assert.ok(Math.abs(gap - 0.08) < 1e-10);
      if (source.kind === "window") assert.notEqual(copy.muntins, source.muntins);
    }
  });

  test("uses unique copy IDs and refuses an opening duplicate when its wall is full", () => {
    const draft = createFloorEditorDraft(derive().floor);
    draft.openings = [
      {
        id: "door",
        wallId: "north",
        kind: "door",
        offsetPlanUnits: 1.6,
        widthPlanUnits: 0.7,
        openingHeightMeters: 2.04,
        sillHeightMeters: 0,
        operation: "hinged",
        variant: "panel",
        finish: "wood",
        leafCount: 1,
      },
    ];
    let history = createFloorEditorHistory(draft);
    history = floorEditorReducer(history, { type: "duplicate-opening", openingId: "door" });
    history = floorEditorReducer(history, { type: "duplicate-opening", openingId: "door" });
    assert.deepEqual(
      history.present.openings.map(({ id }) => id),
      ["door", "door-copy", "door-copy-2"],
    );
    assert.deepEqual(history.present.selection, { kind: "opening", id: "door-copy-2" });

    const full = createFloorEditorDraft(derive().floor);
    full.openings = [{ ...draft.openings[0], widthPlanUnits: 4, offsetPlanUnits: 0 }];
    const blocked = createFloorEditorHistory(full);
    assert.equal(
      floorEditorReducer(blocked, { type: "duplicate-opening", openingId: "door" }),
      blocked,
    );
  });

  test("reports layout-local paths for malformed surface colors", () => {
    const floor = structuredClone(derive().floor);
    floor.rooms[0].floorFinish = { kind: "solid", color: "" };
    floor.walls[0].faceColors = { right: "" };
    const result = validateLayoutFloorSpec(floor);
    assert.deepEqual(
      result.issues.map(({ code, path }) => ({ code, path })),
      [
        { code: "floor-finish.color", path: "rooms[0].floorFinish.color" },
        { code: "wall.face-color", path: "walls[0].faceColors.right" },
      ],
    );
  });

  test("round-trips active and draft storage while retaining corrupt active JSON", () => {
    const records = new Map();
    const storage = {
      getItem: (key) => records.get(key) ?? null,
      setItem: (key, value) => records.set(key, value),
      removeItem: (key) => records.delete(key),
    };
    const floor = derive().floor;
    const first = exportFloorSpec(floor);
    assert.equal(exportFloorSpec(importFloorSpec(first).floor), first);
    saveActiveFloorLayout(storage, "home", floor);
    assert.equal(loadActiveFloorLayout(storage, "home").status, "valid");
    const draft = createFloorEditorDraft(floor);
    draft.walls.pop();
    saveFloorLayoutDraft(storage, "home", draft);
    assert.equal(loadFloorLayoutDraft(storage, "home", floor).walls.length, 3);
    assert.ok(records.has(draftFloorLayoutStorageKey("home")));
    records.set(activeFloorLayoutStorageKey("home"), "{broken");
    const corrupt = loadActiveFloorLayout(storage, "home");
    assert.equal(corrupt.status, "corrupt");
    assert.equal(corrupt.raw, "{broken");
  });

  test("migrates validated legacy active and draft floor records without deleting them", () => {
    const records = new Map();
    const storage = {
      getItem: (key) => records.get(key) ?? null,
      setItem: (key, value) => records.set(key, value),
    };
    const floor = derive().floor;
    const draft = createFloorEditorDraft(floor);
    draft.walls.pop();
    const legacyActiveKey = "smart-home-3d:floor-layout:v1:active:home";
    const legacyDraftKey = "smart-home-3d:floor-layout:v1:draft:home";
    records.set(legacyActiveKey, exportFloorSpec(floor));
    records.set(legacyDraftKey, JSON.stringify(draft));

    assert.equal(loadActiveFloorLayout(storage, "home").status, "valid");
    assert.equal(loadFloorLayoutDraft(storage, "home", floor).walls.length, 3);
    assert.equal(records.get(activeFloorLayoutStorageKey("home")), exportFloorSpec(floor));
    assert.equal(records.get(draftFloorLayoutStorageKey("home")), JSON.stringify(draft));
    assert.equal(records.has(legacyActiveKey), true);
    assert.equal(records.has(legacyDraftKey), true);
  });

  test("does not make active storage destructive when setItem fails", () => {
    const floor = derive().floor;
    const storage = {
      getItem: () => exportFloorSpec(floor),
      setItem: () => {
        throw new Error("quota");
      },
    };
    assert.throws(() => saveActiveFloorLayout(storage, "home", floor), /quota/);
  });

  test("retains only room and slot mappings still present after layout Apply", () => {
    const manifest = structuredClone(neutralDemoManifest);
    manifest.floors[0].rooms[0].dashboardSlots.push({
      id: "demo-temperature",
      compatibleDomains: ["sensor"],
      required: false,
      autoMap: "manual",
      presentation: { label: "Temperature", dashboardRole: "secondary" },
    });
    const profile = {
      schemaVersion: 1,
      homeId: manifest.home.id,
      roomAreaIds: { "demo-room": "living", orphan: "gone" },
      entityIdsBySlotId: { "demo-temperature": "sensor.demo", orphan: "light.gone" },
    };
    const reconciled = reconcileRuntimeBindingProfile(profile, manifest);
    assert.deepEqual(reconciled.roomAreaIds, { "demo-room": "living" });
    assert.deepEqual(reconciled.entityIdsBySlotId, { "demo-temperature": "sensor.demo" });
  });
});
