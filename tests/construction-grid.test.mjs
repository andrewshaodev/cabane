import assert from "node:assert/strict";
import test from "node:test";
import { createElement, Fragment } from "react";
import { create } from "@react-three/test-renderer";
import { useThree } from "@react-three/fiber";
import { Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async load => {
  const { ConstructionGrid } = await load("/apps/web/src/editor-preview/construct/ConstructionGrid.tsx");
  const { FLOOR_EDITOR_GRID_METERS, snapPlanPoint, planPointToWorld } = await load("/packages/engine/src/index.ts");
  test("grid follows panning without intercepting picks and uses the snapping metre interval", async () => {
    let camera;
    function CameraProbe() { camera = useThree(state => state.camera); return null; }
    const renderer = await create(createElement(Fragment, null, createElement(CameraProbe), createElement(ConstructionGrid)));
    try {
      camera.position.set(35, 50, -22);
      await renderer.advanceFrames(1, .016);
      const mesh = renderer.scene.findByProps({ name: "construction-grid" }).instance;
      assert.deepEqual(mesh.position.toArray(), [35, -.04, -22]);
      assert.equal(mesh.material.uniforms.cellSize.value, FLOOR_EDITOR_GRID_METERS);
      assert.equal(mesh.material.depthWrite, false);
      renderer.scene.instance.updateMatrixWorld(true);
      assert.deepEqual(new Raycaster(new Vector3(35, 10, -22), new Vector3(0, -1, 0)).intersectObject(renderer.scene.instance, true), []);
      const coordinates = { origin: [12.3, -8.5], metersPerPlanUnit: .3, scaleBasis: "measured" };
      const snap = snapPlanPoint({ candidate: [13.78, -4.19], coordinates, walls: [], pixelsPerMeter: 100 });
      for (const value of planPointToWorld(snap.point, coordinates)) {
        // Snapping serializes plan coordinates to four decimal places.
        assert.ok(Math.abs(value - Math.round(value / FLOOR_EDITOR_GRID_METERS) * FLOOR_EDITOR_GRID_METERS) < 2e-5);
      }
    } finally { await renderer.unmount(); }
  });
});
