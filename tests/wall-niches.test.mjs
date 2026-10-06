import assert from "node:assert/strict";
import test from "node:test";
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const engine = await load("/packages/engine/src/index.ts");
  const { interactionFloor } = await load("/tests/fixtures/interaction-floor.ts");
  test("shared opening actions persist niches on walls, constrain depth and retain history", () => {
    let history = engine.createFloorEditorHistory(engine.createFloorEditorDraft(interactionFloor));
    const apply = (action) => {
      history = engine.floorEditorReducer(history, action);
    };
    apply({
      type: "add-opening",
      kind: "niche",
      wallId: "fixture-north",
      offsetPlanUnits: 2,
      side: "right",
    });
    const id = history.present.selection.id;
    const current = () =>
      engine.editorWallAttachments(history.present).find((item) => item.id === id);
    assert.equal(current().kind, "niche");
    assert.equal(current().side, "right");
    assert.equal(
      history.present.openings.some((item) => item.id === id),
      false,
      "niche never becomes a through opening",
    );
    apply({
      type: "update-opening",
      opening: {
        ...current(),
        widthPlanUnits: 0.9,
        sillHeightMeters: 0.4,
        openingHeightMeters: 1.4,
        depthMeters: 2,
      },
    });
    assert.ok(Math.abs(current().depthMeters - 0.18) < 1e-9);
    apply({
      type: "update-wall-metadata",
      wallId: "fixture-east",
      changes: { thicknessMeters: 0.1 },
    });
    apply({ type: "move-opening", openingId: id, wallId: "fixture-east", offsetPlanUnits: 1 });
    assert.ok(Math.abs(current().depthMeters - 0.08) < 1e-9);
    assert.equal(
      history.present.walls.find((wall) => wall.id === "fixture-north").niches.length,
      0,
    );
    assert.equal(current().wallId, "fixture-east");
    apply({ type: "undo" });
    assert.equal(current().wallId, "fixture-north");
    apply({ type: "redo" });
    assert.equal(current().wallId, "fixture-east");
    apply({ type: "duplicate-opening", openingId: id });
    assert.equal(
      engine.editorWallAttachments(history.present).filter((item) => item.kind === "niche").length,
      2,
    );
    apply({ type: "select", selection: { kind: "opening", id } });
    apply({ type: "delete-selection" });
    assert.equal(current(), undefined);
    apply({ type: "undo" });
    assert.equal(current().id, id);
    const exported = engine.deriveFloorTopology({
      ...history.present,
      floorId: history.present.floorId,
    });
    assert.equal(exported.issues.length, 0);
    const imported = engine.createFloorEditorDraft(JSON.parse(JSON.stringify(exported.floor)));
    assert.equal(
      engine.editorWallAttachments(imported).find((item) => item.id === id).depthMeters,
      current().depthMeters,
    );
    const before = history;
    apply({ type: "add-opening", kind: "niche", wallId: "fixture-east", offsetPlanUnits: 1 });
    assert.equal(history, before, "overlap does not create a second recess");
  });
  const niche = {
    id: "fixture-niche",
    side: "left",
    offsetFromWallStartPlanUnits: 2,
    widthPlanUnits: 0.6,
    bottomMeters: 0.1,
    heightMeters: 2.3,
    depthMeters: 0.12,
  };
  const floor = (overrides = {}) => ({
    ...interactionFloor,
    walls: interactionFloor.walls.map((w, i) =>
      i === 0 ? { ...w, niches: [{ ...niche, ...overrides }] } : w,
    ),
  });
  test("wall edits preserve niche backing and remove unsupported recesses in one undoable edit", () => {
    const initial = engine.createFloorEditorDraft(floor({ depthMeters: 0.18 }));
    const history = engine.floorEditorReducer(engine.createFloorEditorHistory(initial), {
      type: "update-wall-metadata",
      wallId: initial.walls[0].id,
      changes: { thicknessMeters: 0.1 },
    });
    assert.equal(history.present.walls[0].niches[0].id, niche.id);
    assert.equal(history.present.walls[0].niches[0].depthMeters, 0.08);
    assert.equal(
      engine.validateLayoutFloorSpec(engine.deriveFloorTopology(history.present).floor).valid,
      true,
    );
    assert.equal(engine.floorEditorReducer(history, { type: "undo" }).present, initial);
    const shortened = engine.floorEditorReducer(history, {
      type: "update-wall-metadata",
      wallId: initial.walls[0].id,
      changes: { heightMeters: 2.4 },
    });
    assert.deepEqual(shortened.present.walls[0].niches, []);
    assert.equal(engine.floorEditorReducer(shortened, { type: "undo" }).present, history.present);
  });
  test("niche placement and height edits respect the validator's end and top clearances", () => {
    const initial = engine.createFloorEditorHistory(
      engine.createFloorEditorDraft(interactionFloor),
    );
    const nearEnd = engine.floorEditorReducer(initial, {
      type: "add-opening",
      kind: "niche",
      wallId: "fixture-north",
      offsetPlanUnits: 0.08,
    });
    assert.equal(nearEnd, initial);
    const added = engine.floorEditorReducer(initial, {
      type: "add-opening",
      kind: "niche",
      wallId: "fixture-north",
      offsetPlanUnits: 0.12,
    });
    assert.notEqual(added, initial);
    assert.equal(
      engine.validateLayoutFloorSpec(engine.deriveFloorTopology(added.present).floor).valid,
      true,
    );
    const attachment = engine
      .editorWallAttachments(added.present)
      .find((item) => item.kind === "niche");
    const tooTall = engine.floorEditorReducer(added, {
      type: "update-opening",
      opening: {
        ...attachment,
        openingHeightMeters: interactionFloor.defaultWallHeightMeters - 0.1,
      },
    });
    assert.equal(tooTall, added);
  });
  test("blind cuts expose their back while the opposite wall face remains intact", () => {
    for (const side of ["left", "right"]) {
      const f = floor({ side });
      const full = engine.buildArchitecturalWallGeometries(f);
      const continuous = engine.buildContinuousWallGeometry(f.walls[0], f, f.openings);
      const material = new MeshBasicMaterial({ side: DoubleSide });
      for (const geometries of [full.map((g) => g.geometry), [continuous]]) {
        const meshes = geometries.map((g) => new Mesh(g, material));
        const sign = side === "left" ? 1 : -1;
        const hits = new Raycaster(
          new Vector3(2.3, 1, 0.16 + sign),
          new Vector3(0, 0, -sign),
        ).intersectObjects(meshes);
        assert.ok(hits.length > 0);
        assert.ok(
          Math.abs(hits[0].point.z - (0.16 + sign * (0.1 - 0.12))) < 1e-5,
          "nearest hit is the recessed back",
        );
        const reverse = new Raycaster(
          new Vector3(2.3, 1, 0.16 - sign),
          new Vector3(0, 0, sign),
        ).intersectObjects(meshes);
        assert.ok(
          Math.abs(reverse[0].point.z - (0.16 - sign * 0.1)) < 1e-5,
          "opposite face stays closed",
        );
        const jamb = new Raycaster(
          new Vector3(1.9, 1, 0.16 + sign),
          new Vector3(0, 0, -sign),
        ).intersectObjects(meshes);
        assert.ok(
          Math.abs(jamb[0].point.z - (0.16 + sign * 0.1)) < 1e-5,
          "outside niche remains full thickness",
        );
      }
      full.forEach((g) => g.geometry.dispose());
      continuous.dispose();
      material.dispose();
    }
  });
  test("integral shelves occupy only their actual slab height inside the recess", () => {
    const f = floor({ shelfHeightsMeters: [0.5, 1.1, 1.7], shelfThicknessMeters: 0.025 });
    const groups = engine.buildArchitecturalWallGeometries(f);
    const continuous = engine.buildContinuousWallGeometry(f.walls[0], f, f.openings);
    const material = new MeshBasicMaterial({ side: DoubleSide });
    for (const geometries of [groups.map((g) => g.geometry), [continuous]]) {
      const meshes = geometries.map((g) => new Mesh(g, material));
      for (const level of [0.5, 1.1, 1.7]) {
        const slab = new Raycaster(
          new Vector3(2.3, 0.1 + level + 0.01, 1.16),
          new Vector3(0, 0, -1),
        ).intersectObjects(meshes);
        assert.ok(Math.abs(slab[0].point.z - 0.26) < 1e-5);
        const above = new Raycaster(
          new Vector3(2.3, 0.1 + level + 0.04, 1.16),
          new Vector3(0, 0, -1),
        ).intersectObjects(meshes);
        assert.ok(Math.abs(above[0].point.z - 0.14) < 1e-5);
      }
    }
    groups.forEach((g) => g.geometry.dispose());
    continuous.dispose();
    material.dispose();
    assert.equal(engine.validateLayoutFloorSpec(f).valid, true);
    for (const shelfHeightsMeters of [[0.5, 0.51], [-1], [2.3], [NaN]])
      assert.equal(engine.validateLayoutFloorSpec(floor({ shelfHeightsMeters })).valid, false);
  });
  test("niche validation rejects through cuts, overlap, corners and bad dimensions", () => {
    assert.equal(engine.validateLayoutFloorSpec(floor()).valid, true);
    for (const changes of [
      { depthMeters: 0.19 },
      { bottomMeters: -1 },
      { heightMeters: 4 },
      { offsetFromWallStartPlanUnits: 0 },
      { widthPlanUnits: -1 },
      { side: "front" },
      { depthMeters: NaN },
      { offsetFromWallStartPlanUnits: 5.25 },
    ])
      assert.equal(
        engine.validateLayoutFloorSpec(floor(changes)).valid,
        false,
        JSON.stringify(changes),
      );
    const duplicate = floor();
    duplicate.walls[0].niches.push({ ...niche, id: "second-niche" });
    assert.equal(engine.validateLayoutFloorSpec(duplicate).valid, false);
  });
  test("full project schema round-trips optional niche and shelf data", () => {
    const f = { ...floor({ shelfHeightsMeters: [0.5, 1.1, 1.7] }), floorToFloorHeightMeters: 2.8 };
    const project = {
      schemaVersion: 2,
      seedRevision: "niche-fixture",
      home: engine.neutralDemoManifest.home,
      coordinates: f.coordinates,
      floors: [f],
      stairs: [],
      sceneItems: [],
      roomProfiles: {},
      openingProfiles: {},
      shortcuts: [],
      assumptions: [],
    };
    const parsed = engine.parseHomeProjectSchema(JSON.parse(JSON.stringify(project)));
    assert.equal(parsed.valid, true, JSON.stringify(parsed.issues));
    assert.deepEqual(parsed.project.floors[0].walls[0].niches, f.walls[0].niches);
    const old = { ...project, floors: [interactionFloor] };
    assert.equal(engine.parseHomeProjectSchema(old).valid, true);
  });
  test("Construct preserves niche identities, metadata and undo history", () => {
    const f = floor(),
      draft = engine.createFloorEditorDraft(f);
    assert.deepEqual(draft.walls[0].niches, f.walls[0].niches);
    const history = engine.floorEditorReducer(engine.createFloorEditorHistory(draft), {
      type: "update-wall-metadata",
      wallId: f.walls[0].id,
      changes: { niches: [{ ...niche, depthMeters: 0.1 }] },
    });
    const topology = engine.deriveFloorTopology(history.present);
    assert.equal(
      topology.floor.walls.find((w) => w.id === f.walls[0].id).niches[0].depthMeters,
      0.1,
    );
    assert.deepEqual(engine.floorEditorReducer(history, { type: "undo" }).present.walls[0].niches, [
      niche,
    ]);
    assert.deepEqual(
      engine.deriveWalkColliders(f),
      engine.deriveWalkColliders(interactionFloor),
      "blind niche cannot create a walk-through route",
    );
  });
});
