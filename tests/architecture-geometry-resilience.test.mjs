import assert from "node:assert/strict";
import test from "node:test";
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const {
    buildArchitecturalWallGeometries,
    createFloorEditorDraft,
    createFloorEditorHistory,
    deriveFloorTopology,
    floorEditorReducer,
  } = await load("/packages/engine/src/index.ts");
  const { interactionFloor } = await load("/tests/fixtures/interaction-floor.ts");

  test("slightly diagonal walls leave both sliding-door apertures clear from either side", () => {
    const wall = {
      id: "south",
      from: [14, 17.9],
      to: [0, 18],
      thicknessMeters: 0.32,
      classification: "exterior",
    };
    const floor = {
      ...interactionFloor,
      coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
      walls: [wall],
      wallJunctions: [],
      openings: [2, 8.2].map((offset, index) => ({
        id: `slider-${index}`,
        kind: "door",
        wallId: wall.id,
        offsetFromWallStartPlanUnits: offset,
        widthPlanUnits: 4.2,
        sillHeightMeters: 0,
        openingHeightMeters: 2.4,
        operation: "sliding",
        variant: "full-glass",
        leafCount: 2,
        finish: "white",
      })),
    };
    const groups = buildArchitecturalWallGeometries(floor);
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const meshes = groups.map(({ geometry }) => new Mesh(geometry, material));
    const dx = -14 / Math.hypot(14, 0.1),
      dz = 0.1 / Math.hypot(14, 0.1);
    try {
      for (const opening of floor.openings)
        for (const fraction of [0.1, 0.25, 0.5, 0.75, 0.9]) {
          const distance = opening.offsetFromWallStartPlanUnits + fraction * opening.widthPlanUnits;
          for (const side of [-1, 1]) {
            const ray = new Raycaster(
              new Vector3(14 + dx * distance - dz * side, 1.2, 17.9 + dz * distance + dx * side),
              new Vector3(dz * side, 0, -dx * side),
              0,
              2,
            );
            assert.equal(
              ray.intersectObjects(meshes).length,
              0,
              `${opening.id} at ${fraction}, side ${side}`,
            );
          }
        }
    } finally {
      groups.forEach(({ geometry }) => geometry.dispose());
      material.dispose();
    }
  });

  const editedFloor = (wallId, endpoint, to) => {
    const source = interactionFloor;
    const wall = source.walls.find((candidate) => candidate.id === wallId);
    assert.ok(wall, `missing fixture wall ${wallId}`);
    const history = floorEditorReducer(createFloorEditorHistory(createFloorEditorDraft(source)), {
      type: "move-endpoint",
      from: wall[endpoint],
      to,
    });
    const draft = history.present;
    return deriveFloorTopology({
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
  };

  const assertRenderable = (topology) => {
    assert.ok(topology.floor, "the editor must keep a preview floor for intermediate edits");
    const groups = buildArchitecturalWallGeometries(topology.floor);
    assert.ok(groups.length > 0);
    let triangleCount = 0;
    for (const { geometry } of groups) {
      const positions = geometry.getAttribute("position");
      assert.ok(positions.count > 0);
      assert.ok([...positions.array].every(Number.isFinite));
      triangleCount += (geometry.index?.count ?? 0) / 3;
      geometry.dispose();
    }
    assert.ok(triangleCount > 0);
  };

  test("keeps the fixture scene renderable when an edited passage cut meets a moved junction", () => {
    const topology = editedFloor("fixture-east", "from", [5.26, 0.17]);

    assert.ok(
      !topology.issues.some((issue) => issue.code === "topology.open-walls"),
      "separator walls do not need to enclose a room",
    );
    assertRenderable(topology);
  });

  test("keeps the fixture scene renderable for a near-coincident exterior corner edit", () => {
    const topology = editedFloor("fixture-north", "from", [11.29, 0.17]);

    assert.ok(
      topology.floor.rooms.every((room) => room.name.trim()),
      "new faces receive default room names during the corner edit",
    );
    assert.ok(!topology.issues.some((issue) => issue.code === "topology.room-name"));
    assertRenderable(topology);
  });
});
