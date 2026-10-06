import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { stableFurnishingRegistry } = await load("/packages/catalog/src/furnishing/index.ts");
  test("generic entry and relief presets retain floor or wall contact across variants and axis resizing", async () => {
    for (const id of ["oak-slab-bench", "abstract-relief-wall-art", "line-portrait-wall-art"]) {
      const definition = stableFurnishingRegistry[id];
      for (const variant of definition.variants ?? [{ id: undefined }]) {
        for (const scale of [
          [1, 1, 1],
          [1.2, 0.8, 1.3],
        ]) {
          const size = definition.defaultSize.map((value, axis) => value * scale[axis]);
          const renderer = await create(
            createElement(definition.component, { size, variant: variant.id }),
          );
          try {
            const scene = renderer.scene.instance;
            scene.updateMatrixWorld(true);
            const box = new Box3().setFromObject(scene);
            for (const [edge, actual] of [
              ["min", box.min.toArray()],
              ["max", box.max.toArray()],
            ]) {
              actual.forEach((value, axis) =>
                assert.ok(
                  Math.abs(value - definition.bounds[edge][axis] * scale[axis]) < 0.001,
                  `${id}/${variant.id} ${edge} axis ${axis}: ${value}`,
                ),
              );
            }
            scene.traverse((object) => {
              if (object.isMesh) assert.equal(object.material.isMeshToonMaterial, true);
            });
          } finally {
            await renderer.unmount();
          }
        }
      }
    }
  });
});
