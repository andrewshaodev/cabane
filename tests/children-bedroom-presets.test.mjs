import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { stableFurnishingRegistry } = await load("/packages/catalog/src/furnishing/index.ts");
  test("bunk ladder rungs meet both posts after independent resizing", async () => {
    for (const size of [
      [1.015, 1.6, 2.08],
      [1.2, 1.8, 2.2],
    ]) {
      const renderer = await create(
        createElement(stableFurnishingRegistry["wood-bunk-bed"].component, { size }),
      );
      const root = renderer.scene.instance;
      root.updateMatrixWorld(true);
      const posts = root
        .getObjectsByProperty("name", "bunk-ladder-post")
        .map((n) => new Box3().setFromObject(n));
      const rungs = root
        .getObjectsByProperty("name", "bunk-ladder-rung")
        .map((n) => new Box3().setFromObject(n));
      assert.equal(posts.length, 2);
      assert.equal(rungs.length, 4);
      for (const rung of rungs)
        for (const post of posts)
          assert.ok(rung.intersectsBox(post), "each rung connects to both posts");
      const bounds = new Box3().setFromObject(root);
      assert.ok(Math.abs(bounds.min.y) < 0.001);
      assert.ok(Math.abs(bounds.max.y - size[1]) < 0.001);
      await renderer.unmount();
    }
  });
});
