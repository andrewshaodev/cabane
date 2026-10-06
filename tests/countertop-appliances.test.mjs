import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { stableFurnishingRegistry: models } = await load(
    "/packages/catalog/src/furnishing/index.ts",
  );
  test("mixer bowls remain open and the raised shaft clears their rim while staying joined to the motor", async () => {
    for (const id of ["stand-mixer", "raised-stand-mixer"]) {
      for (const [sx, sy, sz] of [
        [1, 1, 1],
        [0.8, 0.8, 0.8],
        [1.2, 1.2, 1.2],
        [1.2, 0.8, 0.9],
      ]) {
        const def = models[id],
          size = def.defaultSize.map((v, axis) => v * [sx, sy, sz][axis]),
          renderer = await create(createElement(def.component, { size }));
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const bowl = scene.getObjectByName("open-mixing-bowl"),
          shaft = scene.getObjectByName("mixing-shaft"),
          head = scene.getObjectByName("motor-head"),
          pivot = scene.getObjectByName("tilting-head"),
          hinge = scene.getObjectByName("hinge");
        const hits = new Raycaster(
          new Vector3(0, 0.5 * sy, 0.065 * sz),
          new Vector3(0, -1, 0),
        ).intersectObject(bowl, false);
        assert.ok(hits.length);
        assert.ok(
          Math.abs(hits[0].point.y - 0.045 * sy) < 0.001,
          "ray reaches the bowl bottom rather than a top cap",
        );
        const rim = new Box3().setFromObject(bowl).max.y,
          bottom = new Box3().setFromObject(shaft).min.y;
        assert.ok(
          id === "raised-stand-mixer" ? bottom > rim : bottom < rim,
          "shaft clears the rim only when raised",
        );
        const shaftTop = shaft.localToWorld(new Vector3(0, 0.04, 0));
        assert.ok(
          new Box3().setFromObject(head).containsPoint(shaftTop),
          "shaft remains attached to motor",
        );
        const pivotAt = pivot.getWorldPosition(new Vector3()),
          hingeAt = hinge.getWorldPosition(new Vector3());
        assert.ok(
          Math.abs(pivotAt.y - hingeAt.y) < 0.001 && Math.abs(pivotAt.z - hingeAt.z) < 0.001,
          "tilt axis meets the visible rear hinge",
        );
        await renderer.unmount();
      }
    }
  });
});
