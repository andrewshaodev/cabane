import assert from "node:assert/strict";
import test from "node:test";
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");
  const { validateHomeManifest } = await load("/packages/engine/src/validation.ts");
  const {
    createFloorEditorDraft,
    availableOpeningOffsetRanges,
    nearestAvailableOpeningOffset,
    duplicateOpeningOffset,
  } = await load("/packages/engine/src/index.ts");
  const { buildArchitecturalWallGeometries } = await load(
    "/packages/engine/src/architecture-geometry.ts",
  );
  const { openingPlacementIsValid } = await load(
    "/apps/web/src/editor-preview/construct/drag-geometry.ts",
  );
  const overlaps = (manifest) =>
    validateHomeManifest(manifest).issues.filter(
      ({ code }) => code === "wall-junction.opening-overlap",
    );
  const partitionManifest = () => {
    const manifest = structuredClone(neutralDemoManifest);
    const floor = manifest.floors[0];
    floor.walls.push({
      id: "divider",
      from: [3, 0],
      to: [3, 1],
      classification: "interior",
      thicknessMeters: 0.12,
      heightMeters: 0.5,
    });
    floor.wallJunctions.push({
      id: "divider-junction",
      at: [3, 0],
      wallIds: ["north-wall", "divider"],
    });
    Object.assign(floor.openings[1], {
      offsetFromWallStartPlanUnits: 2.5,
      widthPlanUnits: 1,
      sillHeightMeters: 1,
      openingHeightMeters: 1,
    });
    return manifest;
  };
  test("placement and duplication avoid corners and newly drawn T junctions", () => {
    const manifest = partitionManifest();
    const floor = manifest.floors[0];
    floor.walls.at(-1).heightMeters = 2.5;
    const draft = createFloorEditorDraft(floor);
    draft.openings = [];
    draft.junctions = []; // New walls need clearance before saved junctions exist.
    assert.equal(
      openingPlacementIsValid({
        draft,
        wallId: "north-wall",
        offsetPlanUnits: 0,
        widthPlanUnits: 1,
        sillHeightMeters: 1,
      }),
      false,
      "preview must reject the corner too",
    );
    const ranges = availableOpeningOffsetRanges({
      draft,
      wallId: "north-wall",
      widthPlanUnits: 1,
      sillHeightMeters: 1,
    });
    for (const requested of [0, 2.5, 4.8]) {
      const offset = nearestAvailableOpeningOffset(requested, ranges);
      assert.notEqual(offset, undefined);
      floor.openings[1].offsetFromWallStartPlanUnits = offset;
      assert.deepEqual(overlaps(manifest), []);
    }
    draft.openings = createFloorEditorDraft(floor).openings;
    const offset = duplicateOpeningOffset(draft, "demo-window");
    assert.notEqual(offset, undefined);
    floor.openings[1].offsetFromWallStartPlanUnits = offset;
    assert.deepEqual(overlaps(manifest), []);
  });
  test("clearance keeps its physical size when the floor uses non-metre plan units", () => {
    const manifest = partitionManifest();
    const floor = manifest.floors[0];
    floor.coordinates.metersPerPlanUnit = 0.5;
    for (const wall of floor.walls) {
      wall.from = wall.from.map((value) => value * 2);
      wall.to = wall.to.map((value) => value * 2);
    }
    for (const junction of floor.wallJunctions) junction.at = junction.at.map((value) => value * 2);
    for (const opening of floor.openings) {
      opening.offsetFromWallStartPlanUnits *= 2;
      opening.widthPlanUnits *= 2;
    }
    const draft = createFloorEditorDraft(floor);
    draft.openings = [];
    const offset = nearestAvailableOpeningOffset(
      0,
      availableOpeningOffsetRanges({
        draft,
        wallId: "north-wall",
        widthPlanUnits: 2,
        sillHeightMeters: 1,
      }),
    );
    assert.ok(Math.abs(offset * 0.5 - 0.07) < 1e-6);
    floor.openings[1].offsetFromWallStartPlanUnits = offset;
    assert.deepEqual(overlaps(manifest), []);
  });
  test("the accepted window above a low partition has a clear rendered aperture", () => {
    const groups = buildArchitecturalWallGeometries(partitionManifest().floors[0]);
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const meshes = groups.map(({ geometry }) => new Mesh(geometry, material));
    try {
      for (const side of [-1, 1]) {
        const ray = new Raycaster(
          new Vector3(3, 1.5, side * 0.4),
          new Vector3(0, 0, -side),
          0,
          0.8,
        );
        assert.equal(ray.intersectObjects(meshes).length, 0);
      }
      const below = new Raycaster(new Vector3(3, 0.25, -0.4), new Vector3(0, 0, 1), 0, 0.8);
      assert.ok(below.intersectObjects(meshes).length > 0, "the wall below the sill stays solid");
    } finally {
      groups.forEach(({ geometry }) => geometry.dispose());
      material.dispose();
    }
  });
  test("a window above a low partition is allowed but a taller partition is rejected", () => {
    const manifest = partitionManifest();
    assert.deepEqual(overlaps(manifest), []);
    const draft = createFloorEditorDraft(manifest.floors[0]);
    draft.openings = [];
    const request = { draft, wallId: "north-wall", widthPlanUnits: 1, sillHeightMeters: 1 };
    assert.equal(nearestAvailableOpeningOffset(2.5, availableOpeningOffsetRanges(request)), 2.5);
    assert.equal(openingPlacementIsValid({ ...request, offsetPlanUnits: 2.5 }), true);
    manifest.floors[0].walls.at(-1).heightMeters = 1;
    assert.deepEqual(overlaps(manifest), [], "touching the sill is not vertical overlap");
    manifest.floors[0].walls.at(-1).heightMeters = 1.1;
    assert.equal(overlaps(manifest).length, 1);
    draft.walls.at(-1).heightMeters = 1.1;
    assert.notEqual(nearestAvailableOpeningOffset(2.5, availableOpeningOffsetRanges(request)), 2.5);
    delete manifest.floors[0].walls.at(-1).heightMeters;
    assert.equal(overlaps(manifest).length, 1, "missing height uses the floor default");
  });
});
