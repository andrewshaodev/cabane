import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { PlaneGeometry, Matrix4, Euler, Quaternion, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const { PlanStrokeBatch, planStrokePositions } = await load("/apps/web/src/editor-preview/construct/PlanStrokeBatch.tsx");
  const { StairPlanStrokes } = await load("/packages/engine/src/stairs/models/StairPlanStrokes.tsx");
  test("batched strokes preserve the existing plane corners at every orientation", () => {
    const keys = positions => {
      const result = new Set();
      for (let i = 0; i < positions.length; i += 3) result.add(positions.slice(i, i + 3).map(n => Math.round(n * 1e5)).join(","));
      return [...result].sort();
    };
    for (const to of [[4, 2], [-4, 2], [1, -3], [1, 8]]) {
      const from = [1, 2], width = .07, elevation = .035;
      const dx = to[0] - from[0], dz = to[1] - from[1];
      const old = new PlaneGeometry(Math.hypot(dx, dz), width);
      const matrix = new Matrix4().makeRotationFromEuler(new Euler(-Math.PI / 2, 0, -Math.atan2(dz, dx)));
      matrix.setPosition((from[0] + to[0]) / 2, elevation, (from[1] + to[1]) / 2);
      old.applyMatrix4(matrix);
      assert.deepEqual(keys(planStrokePositions({ from, to, width, elevation, color: "red" })), keys(Array.from(old.attributes.position.array)));
      old.dispose();
    }
  });
  test("hundreds of strokes use one mesh per color/overlay style", async () => {
    const strokes = Array.from({ length: 300 }, (_, index) => ({ from: [index, 0], to: [index, 2], color: index % 2 ? "red" : "blue" }));
    const renderer = await create(createElement(PlanStrokeBatch, { strokes, name: "test-strokes" }));
    try {
      const meshes = renderer.scene.findAllByType("Mesh");
      assert.equal(meshes.length, 2);
      assert.equal(meshes.reduce((sum, mesh) => sum + mesh.instance.geometry.attributes.position.count / 3, 0), 600);
    } finally { await renderer.unmount(); }
  });
  test("instanced stair treads and arrows retain their dimensions and elevations", async () => {
    const renderer = await create(createElement(StairPlanStrokes, { flight: { widthMeters: 1.2, runMeters: 4, stepCount: 16 }, upper: false, ink: "black" }));
    try {
      const mesh = renderer.scene.findByProps({ name: "stair-plan-strokes" }).instance;
      assert.equal(mesh.count, 22);
      const matrix = new Matrix4();
      mesh.getMatrixAt(0, matrix);
      const position = new Vector3(), scale = new Vector3();
      matrix.decompose(position, new Quaternion(), scale);
      assert.ok(position.distanceTo(new Vector3(-.6, .002, 2)) < 1e-6);
      assert.ok(scale.distanceTo(new Vector3(.025, .008, 4)) < 1e-6);
      mesh.getMatrixAt(mesh.count - 1, matrix);
      assert.ok(Math.abs(matrix.elements[13] - .017) < 1e-6);
    } finally { await renderer.unmount(); }
  });
});
