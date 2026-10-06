import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { RoundedBox as Original } from "@react-three/drei";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { roundedBoxGeometry } = await load(
    "/packages/engine/src/rounded-box/rounded-box-geometry.ts",
  );
  test("cached rounded boxes preserve Drei positions, normals, UVs and groups", async () => {
    for (const [size, radius, smoothness, bevelSegments] of [
      [[1, 1, 1], 0.05, 4, 4],
      [[0.07, 0.07, 0.049], 0.012, 2, 4],
      [[2, 0.025, 0.6], 0.006, 2, 2],
      [[0.12, 0.12, 0.025], 0.018, 2, 4],
    ]) {
      const renderer = await create(
        createElement(Original, { args: size, radius, smoothness, bevelSegments }),
      );
      const original = renderer.scene.findByType("Mesh").instance.geometry;
      const actual = roundedBoxGeometry(...size, radius, 1, smoothness, bevelSegments, 0.4);
      for (const name of ["position", "normal", "uv"])
        assert.deepEqual(actual.attributes[name].array, original.attributes[name].array, name);
      assert.deepEqual(actual.groups, original.groups);
      const reused = roundedBoxGeometry(...size, radius, 1, smoothness, bevelSegments, 0.4);
      actual.attributes.position.array[0] = 999;
      actual.dispose();
      assert.deepEqual(
        reused.attributes.position.array,
        original.attributes.position.array,
        "independent mutable ownership",
      );
      reused.dispose();
      await renderer.unmount();
    }
  });
});
