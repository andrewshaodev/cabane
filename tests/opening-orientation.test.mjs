import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const engine = await load("/packages/engine/src/index.ts");
  const { DoorModel } = await load("/packages/catalog/src/architecture/presets/openings/doors/door-model.tsx");
  const { WindowModel } = await load("/packages/catalog/src/architecture/presets/openings/windows/window-model.tsx");
  const { openingPlanSymbol } = await load("/apps/web/src/editor-preview/construct/opening-plan-symbol.ts");
  const { constructEditorHistoryReducer } = await load("/apps/web/src/editor-preview/construct/useConstructEditor.ts");
  const { floorWithOpeningOrientations } = await load("/apps/web/src/editor-preview/construct/opening-orientation-floor.ts");
  const { ownerHomeProject, ownerProjectManifest } = await load("/tests/fixtures/bundled-home.ts");
  const floor = structuredClone(engine.neutralDemoManifest.floors[0]);
  const door = { ...floor.openings.find((opening) => opening.kind === "door"), operation: "hinged", variant: "panel", leafCount: 1 };
  const windowOpening = { ...floor.openings.find((opening) => opening.kind === "window"), operation: "casement", panelCount: 1 };
  const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≠ ${expected}`);

  test("legacy defaults, paired movement, fixed windows, and inactive preferences", () => {
    const defaults = engine.resolveOpeningOrientation(door);
    assert.equal(defaults.sideSign, 1);
    assert.equal(defaults.leaves[0].pivotRatio, 0);
    assert.equal(defaults.leaves[0].rotationSign, -1);
    assert.equal(defaults.leaves[0].slideSign, -1);
    for (const pair of [{ ...door, leafCount: 2 }, { ...windowOpening, panelCount: 2 }]) {
      const orientation = engine.resolveOpeningOrientation({ ...pair, hingeSide: "end", openingSide: "left" });
      assert.equal(orientation.canSwapHinge, false);
      assert.deepEqual(orientation.leaves.map((leaf) => leaf.pivotRatio), [0, 1]);
      assert.deepEqual(orientation.leaves.map((leaf) => leaf.rotationSign), [1, -1]);
    }
    const sliding = { ...door, operation: "sliding", leafCount: 2, slideDirection: "end" };
    assert.deepEqual(engine.resolveOpeningOrientation(sliding).leaves.map((leaf) => leaf.slideSign), [-1, 1]);
    assert.equal(engine.changeOpeningOrientation(sliding, "slide"), sliding);
    const fixed = { ...windowOpening, operation: "fixed" };
    for (const action of ["hinge", "side", "slide"]) assert.equal(engine.changeOpeningOrientation(fixed, action), fixed);
  });

  test("each orientation action is one Undo step and never repairs or moves an invalid opening", () => {
    const draft = engine.createFloorEditorDraft(floor);
    Object.assign(draft.openings[0], { offsetPlanUnits: -1.23456, widthPlanUnits: .12345 });
    const original = structuredClone(draft.openings[0]);
    let history = engine.createFloorEditorHistory(draft);
    history = constructEditorHistoryReducer(history, { type: "reorient-opening", openingId: original.id, change: "hinge" });
    assert.equal(history.past.length, 1);
    assert.deepEqual(history.present.openings[0], { ...original, hingeSide: "end" });
    history = constructEditorHistoryReducer(history, { type: "undo" });
    assert.deepEqual(history.present.openings[0], original);
    history = constructEditorHistoryReducer(history, { type: "redo" });
    assert.equal(history.present.openings[0].hingeSide, "end");
  });

  test("property-only edits preserve the accepted owner floor and bindings without deriving rooms", async () => {
    const accepted = ownerProjectManifest.floors[0];
    const original = engine.createFloorEditorDraft(accepted);
    const opening = original.openings.find((candidate) => candidate.kind === "door" && candidate.leafCount === 1);
    let history = engine.createFloorEditorHistory(original);
    history = constructEditorHistoryReducer(history, { type: "reorient-opening", openingId: opening.id, change: "hinge" });
    const updated = floorWithOpeningOrientations(original, history.present, accepted);
    assert.equal(updated.rooms, accepted.rooms);
    assert.equal(updated.walls, accepted.walls);
    assert.equal(updated.ceilings, accepted.ceilings);
    const changed = updated.openings.find((candidate) => candidate.id === opening.id);
    const before = accepted.openings.find((candidate) => candidate.id === opening.id);
    assert.deepEqual(changed, { ...before, hingeSide: "end" });
    assert.equal(changed.contactSlot, before.contactSlot);
    const restored = floorWithOpeningOrientations(history.present, original, updated);
    assert.deepEqual(restored, accepted);
    const moved = { ...history.present, openings: history.present.openings.map((candidate) => candidate.id === opening.id ? { ...candidate, offsetPlanUnits: 1.5 } : candidate) };
    assert.equal(floorWithOpeningOrientations(history.present, moved, updated), null);
  });

  test("project and floor conversion preserve orientation and reject invalid enum values", () => {
    const project = structuredClone(ownerHomeProject);
    for (const opening of project.floors[0].openings) {
      if (opening.kind === "passage") continue;
      opening.openingSide = "left";
      if (opening.kind === "window" || opening.operation === "hinged") opening.hingeSide = "end";
      if (opening.operation === "sliding") opening.slideDirection = "end";
    }
    assert.equal(engine.parseHomeProjectSchema(project).valid, true);
    assert.deepEqual(engine.parseHomeProject(engine.serializeHomeProject(project)).project, project);
    const draft = engine.createFloorEditorDraft(project.floors[0]);
    const restored = engine.deriveFloorTopology(draft).floor;
    for (const before of project.floors[0].openings.filter((opening) => opening.kind !== "passage")) {
      const after = restored.openings.find((opening) => opening.id === before.id);
      assert.equal(after.hingeSide, before.hingeSide);
      assert.equal(after.openingSide, before.openingSide);
      assert.equal(after.slideDirection, before.slideDirection);
    }
    for (const [property, value] of [["hingeSide", "middle"], ["openingSide", "inside"], ["slideDirection", 1]]) {
      const invalid = structuredClone(project);
      const opening = invalid.floors[0].openings.find((candidate) => candidate.kind === "door");
      opening[property] = value;
      assert.equal(engine.parseHomeProjectSchema(invalid).valid, false);
      assert.equal(engine.validateLayoutFloorSpec(invalid.floors[0]).valid, false);
    }
  });

  test("plan symbols and animated models agree for every hinge and swing combination on rotated/reversed walls", async () => {
    for (const [base, Model] of [[door, DoorModel], [windowOpening, WindowModel]]) {
      for (const hingeSide of ["start", "end"]) for (const openingSide of ["left", "right"]) {
        const opening = { ...base, hingeSide, openingSide };
        const sign = openingSide === "left" ? -1 : 1;
        const reversed = hingeSide === "end";
        const wall = { ...floor.walls[0], from: reversed ? [5, 4] : [1, 1], to: reversed ? [1, 1] : [5, 4] };
        const renderer = await create(createElement(Model, { opening, wall, floor, position: 1, reducedMotion: true }));
        try {
          await renderer.advanceFrames(1, .1);
          const motion = renderer.scene.findByProps({ name: "opening-leaf-motion" }).instance;
          near(motion.rotation.y, (reversed ? 1 : -1) * sign * (opening.kind === "door" ? Math.PI * .48 : .34));
          renderer.scene.instance.updateMatrixWorld(true);
          const child = motion.children[0];
          const center = child.getWorldPosition(new Vector3());
          const pivot = motion.getWorldPosition(new Vector3());
          const dx = wall.to[0] - wall.from[0], dz = wall.to[1] - wall.from[1];
          assert.equal(Math.sign((center.x - pivot.x) * -dz + (center.z - pivot.z) * dx), sign);
          const width = opening.widthPlanUnits * floor.coordinates.metersPerPlanUnit;
          const symbol = openingPlanSymbol(opening, width, wall.thicknessMeters);
          const swing = symbol[opening.kind === "door" ? 2 : 4];
          near(swing.from[0], reversed ? width : 0);
          assert.equal(Math.sign(swing.to[1]), sign);
          if (opening.kind === "window") {
            const handle = renderer.scene.findAll((node) => node.props.name?.startsWith("opening-window-handle"))[0].instance;
            assert.equal(handle.parent, child);
          }
          await renderer.update(createElement(Model, { opening: { ...opening, openingSide: sign === 1 ? "left" : "right" }, wall, floor, position: 1, reducedMotion: false }));
          await renderer.advanceFrames(100, .05);
          assert.equal(Math.sign(motion.rotation.y), (reversed ? -1 : 1) * sign);
          await renderer.update(createElement(Model, { opening, wall, floor, position: 0, reducedMotion: true }));
          await renderer.advanceFrames(1, .1);
          near(motion.rotation.y, 0);
        } finally { await renderer.unmount(); }
      }
    }
  });

  test("sliding leaf, pull, and rail follow both travel directions and wall sides", async () => {
    for (const slideDirection of ["start", "end"]) for (const openingSide of ["left", "right"]) {
      const opening = { ...door, operation: "sliding", variant: "plank", slideDirection, openingSide };
      const wall = floor.walls.find((candidate) => candidate.id === door.wallId);
      const width = opening.widthPlanUnits * floor.coordinates.metersPerPlanUnit;
      const travel = width - .018;
      const sign = slideDirection === "start" ? -1 : 1;
      const side = openingSide === "left" ? -1 : 1;
      const renderer = await create(createElement(DoorModel, { opening, wall, floor, position: 1, reducedMotion: true }));
      try {
        await renderer.advanceFrames(1, .1);
        const motion = renderer.scene.findByProps({ name: "opening-leaf-motion" }).instance;
        near(motion.position.x, sign * travel);
        const mount = renderer.scene.findByProps({ name: "opening-plank-sliding-leaf-mount" });
        assert.equal(Math.sign(mount.props.position[2]), side);
        const rail = renderer.scene.findByProps({ name: "opening-plank-rail" });
        assert.equal(Math.sign(rail.props.position[2]), side);
        const bar = renderer.scene.findByProps({ name: "opening-plank-rail-bar" });
        near(bar.props.position[0], sign === -1 ? 0 : travel);
        const geometry = bar.children[0].instance.geometry;
        geometry.computeBoundingBox();
        const railLength = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        assert.ok(railLength >= travel * 2);
        const symbol = openingPlanSymbol(opening, width, wall.thicknessMeters);
        assert.equal(Math.sign(symbol[2].from[1]), side);
        assert.equal(Math.sign(symbol[3].to[0] - symbol[3].from[0]), sign);
      } finally { await renderer.unmount(); }
    }
  });
});
