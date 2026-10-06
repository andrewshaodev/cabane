import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { createFloorEditorDraft, createFloorEditorHistory, floorEditorReducer } = await load(
    "/packages/engine/src/home-editor/construct/editor-state.ts",
  );
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");

  test("edits floor coordinates and default heights as one reversible command", () => {
    const floor = structuredClone(neutralDemoManifest.floors[0]);
    floor.coordinates = {
      origin: [12, -4],
      metersPerPlanUnit: 0.25,
      scaleBasis: "inferred",
    };
    floor.defaultWallHeightMeters = 2.45;
    floor.defaultCeilingHeightMeters = 2.6;

    const initialDraft = createFloorEditorDraft(floor);
    assert.deepEqual(initialDraft.coordinates, floor.coordinates);
    assert.notEqual(initialDraft.coordinates, floor.coordinates);
    assert.notEqual(initialDraft.coordinates.origin, floor.coordinates.origin);

    const authoredData = {
      walls: structuredClone(initialDraft.walls),
      openings: structuredClone(initialDraft.openings),
      rooms: structuredClone(initialDraft.rooms),
      junctions: structuredClone(initialDraft.junctions),
      nextSerial: initialDraft.nextSerial,
    };
    let history = createFloorEditorHistory(initialDraft);
    history = floorEditorReducer(history, {
      type: "update-floor-settings",
      settings: {
        coordinates: {
          origin: [-1.5, 7.25],
          metersPerPlanUnit: 0.5,
          scaleBasis: "measured",
        },
        defaultWallHeightMeters: 3.1,
        defaultCeilingHeightMeters: 2.95,
      },
    });

    assert.equal(history.past.length, 1);
    assert.deepEqual(history.present.coordinates, {
      origin: [-1.5, 7.25],
      metersPerPlanUnit: 0.5,
      scaleBasis: "measured",
    });
    assert.equal(history.present.defaultWallHeightMeters, 3.1);
    assert.equal(history.present.defaultCeilingHeightMeters, 2.95);
    assert.deepEqual(
      {
        walls: history.present.walls,
        openings: history.present.openings,
        rooms: history.present.rooms,
        junctions: history.present.junctions,
        nextSerial: history.present.nextSerial,
      },
      authoredData,
      "scale metadata must not rewrite authored IDs or geometry",
    );

    history = floorEditorReducer(history, { type: "undo" });
    assert.deepEqual(history.present, initialDraft);
    assert.equal(history.future.length, 1);

    history = floorEditorReducer(history, { type: "redo" });
    assert.deepEqual(history.present.coordinates, {
      origin: [-1.5, 7.25],
      metersPerPlanUnit: 0.5,
      scaleBasis: "measured",
    });
    assert.equal(history.past.length, 1);
    assert.equal(history.future.length, 0);
  });

  test("does not create history entries for unchanged or invalid floor settings", () => {
    const draft = createFloorEditorDraft(neutralDemoManifest.floors[0]);
    const history = createFloorEditorHistory(draft);
    const unchanged = floorEditorReducer(history, {
      type: "update-floor-settings",
      settings: {
        coordinates: structuredClone(draft.coordinates),
        defaultWallHeightMeters: draft.defaultWallHeightMeters,
        defaultCeilingHeightMeters: draft.defaultCeilingHeightMeters,
      },
    });
    assert.equal(unchanged, history);

    const invalid = floorEditorReducer(history, {
      type: "update-floor-settings",
      settings: {
        coordinates: { ...draft.coordinates, metersPerPlanUnit: 0 },
        defaultWallHeightMeters: draft.defaultWallHeightMeters,
        defaultCeilingHeightMeters: draft.defaultCeilingHeightMeters,
      },
    });
    assert.equal(invalid, history);
  });

  test("keeps default openings physically sized under a calibrated scale", () => {
    const floor = structuredClone(neutralDemoManifest.floors[0]);
    floor.coordinates = {
      origin: [10, -2],
      metersPerPlanUnit: 0.5,
      scaleBasis: "measured",
    };
    let history = createFloorEditorHistory(createFloorEditorDraft(floor));
    history = floorEditorReducer(history, {
      type: "add-opening",
      wallId: history.present.walls[0].id,
      kind: "door",
      offsetPlanUnits: 0,
    });
    const door = history.present.openings.at(-1);
    assert.equal(door.widthPlanUnits, 1.8);
    assert.equal(door.widthPlanUnits * floor.coordinates.metersPerPlanUnit, 0.9);
  });
});
