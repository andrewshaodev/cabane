import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Color } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { buildArchitecturalWallGeometries } = await load(
    "/packages/engine/src/architecture-geometry.ts",
  );
  const { ArchitecturalWall } = await load(
    "/packages/engine/src/architecture-scene/ArchitecturalWalls.tsx",
  );
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");
  const { createFloorEditorDraft, createFloorEditorHistory, floorEditorReducer } = await load(
    "/packages/engine/src/home-editor/construct/editor-state.ts",
  );
  const { deriveFloorTopology } = await load(
    "/packages/engine/src/home-editor/construct/topology.ts",
  );
  function checkGeometry(geometry, edges, left, right) {
    const normals = geometry.getAttribute("normal"),
      colors = geometry.getAttribute("color");
    let caps = 0;
    for (let index = 0; index < normals.count; index++) {
      const z = normals.getZ(index);
      const edge = Math.abs(z) < 0.999;
      if (edge) caps++;
      const expected = new Color(edge ? edges : z > 0 ? left : right);
      for (const [channel, value] of [
        ["X", expected.r],
        ["Y", expected.g],
        ["Z", expected.b],
      ])
        assert.ok(
          Math.abs(colors[`get${channel}`](index) - value) < 0.000001,
          `vertex ${index}: ${edge ? "cap/reveal" : "face"}`,
        );
    }
    assert.ok(caps > 0, "real cap and reveal vertices verified");
  }
  test("Auto and custom edge colors agree across standalone and batched walls with an opening", async () => {
    for (const scenario of [
      { faces: { left: "#bcb99b", right: "#bcb99b" }, edges: "#bcb99b" },
      { faces: { left: "#bcb99b", right: "#efece3" }, edges: "#e4e0d8" },
      { faces: { left: "#bcb99b", right: "#efece3" }, edgeColor: "#334455", edges: "#334455" },
    ]) {
      const floor = structuredClone(neutralDemoManifest.floors[0]);
      const wall = {
        id: "painted",
        from: [1, 1],
        to: [3, 1],
        classification: "interior",
        thicknessMeters: 0.2,
        heightMeters: 2.5,
        faceColors: scenario.faces,
        ...(scenario.edgeColor ? { edgeColor: scenario.edgeColor } : {}),
      };
      floor.walls = [wall];
      floor.wallJunctions = [];
      floor.openings = [
        {
          id: "window",
          kind: "window",
          wallId: wall.id,
          offsetFromWallStartPlanUnits: 0.8,
          widthPlanUnits: 0.4,
          openingHeightMeters: 1.2,
          sillHeightMeters: 0.8,
          operation: "fixed",
          variant: "plain",
          panelCount: 1,
          glazing: "clear",
        },
      ];
      const assemblies = buildArchitecturalWallGeometries(floor, "#e4e0d8", "#c97370");
      for (const { geometry } of assemblies) {
        checkGeometry(geometry, scenario.edges, scenario.faces.left, scenario.faces.right);
        geometry.dispose();
      }
      const renderer = await create(
        createElement(ArchitecturalWall, {
          floor,
          wall,
          openings: floor.openings,
          interiorColor: "#e4e0d8",
          exteriorColor: "#c97370",
          fade: false,
          reducedMotion: true,
        }),
      );
      let checked = 0;
      renderer.scene.instance.traverse((node) => {
        if (node.isMesh && node.geometry.getAttribute("color")) {
          checkGeometry(node.geometry, scenario.edges, scenario.faces.left, scenario.faces.right);
          checked++;
        }
      });
      assert.ok(checked > 0);
      await renderer.unmount();
    }
  });
  test("custom edge metadata survives topology and undo/redo and Auto clears it", () => {
    const floor = structuredClone(neutralDemoManifest.floors[0]);
    floor.walls[0].edgeColor = "#334455";
    let history = createFloorEditorHistory(createFloorEditorDraft(floor));
    const id = floor.walls[0].id;
    assert.equal(history.present.walls.find((w) => w.id === id).edgeColor, "#334455");
    assert.equal(
      deriveFloorTopology(history.present).floor.walls.find((w) => w.id === id).edgeColor,
      "#334455",
    );
    history = floorEditorReducer(history, {
      type: "update-wall-metadata",
      wallId: id,
      changes: { edgeColor: undefined },
    });
    assert.equal(history.present.walls.find((w) => w.id === id).edgeColor, undefined);
    assert.equal(
      JSON.parse(JSON.stringify(deriveFloorTopology(history.present).floor)).walls.find(
        (w) => w.id === id,
      ).edgeColor,
      undefined,
    );
    history = floorEditorReducer(history, { type: "undo" });
    assert.equal(history.present.walls.find((w) => w.id === id).edgeColor, "#334455");
    history = floorEditorReducer(history, { type: "redo" });
    assert.equal(history.present.walls.find((w) => w.id === id).edgeColor, undefined);
  });
});
