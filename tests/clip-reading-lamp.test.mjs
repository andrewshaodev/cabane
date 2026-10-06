import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { stableFurnishingRegistry } = await load("/packages/catalog/src/furnishing/index.ts");
  test("clip reading lamp keeps its rail aperture, bridge and flexible neck joined when resized", async () => {
    for (const size of [
      [0.07, 0.48, 0.186125],
      [0.035, 0.24, 0.0930625],
      [0.09, 0.55, 0.22],
    ]) {
      const renderer = await create(
        createElement(stableFurnishingRegistry["clip-reading-lamp"].component, { size }),
      );
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const bounds = (name) => new Box3().setFromObject(scene.getObjectByName(name));
      const back = bounds("clip-jaw--1"),
        front = bounds("clip-jaw-1"),
        bridge = bounds("clip-bridge");
      const sy = size[1] / 0.48,
        sz = size[2] / 0.186125;
      assert.ok(Math.abs(front.min.z - back.max.z - 0.04 * sz) < 0.00002);
      assert.ok(Math.abs(bridge.min.y - front.max.y) < 0.00002);
      assert.ok(Math.abs(bridge.min.y - back.max.y) < 0.00002);
      const neck = scene.getObjectByName("clip-flexible-neck");
      const points = neck.geometry.parameters.path;
      const start = neck.localToWorld(points.getPoint(0).clone());
      assert.ok(
        bridge
          .clone()
          .expandByScalar(0.005 * Math.max(sy, sz))
          .containsPoint(start),
      );
      const shade = scene.getObjectByName("clip-lamp-shade");
      const neckEnd = neck.localToWorld(points.getPoint(1).clone());
      const shadeJoint = shade.localToWorld(new Vector3(0, -0.039, 0));
      assert.ok(neckEnd.distanceTo(shadeJoint) < 0.003 * Math.max(sy, sz));
      const diffuser = bounds("clip-lamp-diffuser");
      assert.ok(bounds("clip-lamp-shade").intersectsBox(diffuser));
      await renderer.unmount();
    }
  });
});
