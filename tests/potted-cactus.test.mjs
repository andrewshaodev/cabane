import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { stableFurnishingRegistry } = await load("/packages/catalog/src/furnishing/index.ts");
  test("cactus soil rests on the pot base and both columns meet the soil after proportional and independent resizing", async () => {
    for (const size of [
      [0.03, 0.09, 0.03],
      [0.06, 0.18, 0.06],
      [0.078, 0.18, 0.06],
      [0.06, 0.216, 0.048],
    ]) {
      const renderer = await create(
        createElement(stableFurnishingRegistry["potted-cactus"].component, {
          size,
        }),
      );
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const pot = scene.getObjectByName("cactus-ceramic-pot"),
        soil = new Box3().setFromObject(scene.getObjectByName("cactus-soil"));
      const base = new Raycaster(
        new Vector3(0, size[1] / 6, 0),
        new Vector3(0, -1, 0),
      ).intersectObject(pot, false)[0];
      assert.ok(base);
      assert.ok(Math.abs(soil.min.y - base.point.y) < 0.00001);
      for (const name of ["main", "small"]) {
        const column = new Box3().setFromObject(scene.getObjectByName(`cactus-${name}-column`));
        assert.ok(Math.abs(column.min.y - soil.max.y) < 0.00001);
        assert.ok(column.min.x >= soil.min.x && column.max.x <= soil.max.x);
        assert.ok(column.min.z >= soil.min.z && column.max.z <= soil.max.z);
      }
      assert.ok(Math.abs(new Box3().setFromObject(pot).min.y) < 0.00001);
      await renderer.unmount();
    }
  });
});
