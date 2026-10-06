import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Vector3, Raycaster } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { stableFurnishingRegistry: registry } = await load(
    "/packages/catalog/src/furnishing/index.ts",
  );
  test("wall vent mounts vertically with a recessed open grille under axis resizing", async () => {
    for (const size of [
      [0.11, 0.11, 0.01],
      [0.14, 0.11, 0.015],
      [0.09, 0.13, 0.008],
    ]) {
      const renderer = await create(createElement(registry["round-wall-vent"].component, { size }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(scene),
        extents = bounds.getSize(new Vector3());
      size.forEach((v, k) => assert.ok(Math.abs(extents.getComponent(k) - v) < 0.00001));
      assert.ok(
        Math.abs(bounds.min.y) < 0.00001 && Math.abs(bounds.min.z) < 0.00001,
        "bottom and back origins",
      );
      const rim = scene.getObjectByName("platform-vent-rim");
      assert.equal(
        new Raycaster(
          new Vector3(0, size[1] / 2, size[2] + 0.01),
          new Vector3(0, 0, -1),
        ).intersectObject(rim).length,
        0,
        "open rim",
      );
      for (const index of [-2, -1, 0, 1, 2]) {
        const b = new Box3().setFromObject(scene.getObjectByName(`platform-vent-louver-${index}`));
        assert.ok(bounds.max.z - b.max.z > 0.09 * size[2], "recessed behind front rim");
      }
      await renderer.unmount();
    }
  });
});
