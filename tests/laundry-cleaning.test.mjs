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
  test("cleaning tool heads, shafts, grips and wall clamps remain connected without head overlap", async () => {
    for (const size of [
      [0.22, 1.3, 0.12],
      [0.3, 1.5, 0.15],
      [0.18, 1, 0.09],
    ]) {
      const r = await create(
        createElement(registry["wall-cleaning-tool-rack"].component, { size }),
      );
      const scene = r.scene.instance;
      scene.updateMatrixWorld(true);
      const box = (name) => new Box3().setFromObject(scene.getObjectByName(name));
      const heads = [];
      for (let i = 0; i < 3; i++) {
        const head = box(`cleaning-head-${i}`),
          shaft = box(`cleaning-shaft-${i}`);
        heads.push(head);
        assert.ok(head.intersectsBox(shaft));
        assert.ok(shaft.intersectsBox(box(`cleaning-grip-${i}`)));
        assert.ok(shaft.intersectsBox(box(`cleaning-clamp-${i}`)));
        assert.ok(box(`cleaning-clamp-${i}`).intersectsBox(box(`cleaning-clamp-bridge-${i}`)));
        assert.ok(box(`cleaning-clamp-bridge-${i}`).intersectsBox(box("cleaning-tool-holder")));
      }
      for (let i = 0; i < 3; i++)
        for (let j = i + 1; j < 3; j++)
          assert.equal(heads[i].intersectsBox(heads[j]), false, "parked heads clear each other");
      await r.unmount();
    }
  });
  test("wringer bucket stays open down to its closed bottom", async () => {
    const r = await create(createElement(registry["wringer-bucket"].component, {}));
    const s = r.scene.instance;
    s.updateMatrixWorld(true);
    const ray = new Raycaster(new Vector3(0.066, 0.4, 0), new Vector3(0, -1, 0));
    assert.equal(ray.intersectObject(s.getObjectByName("bucket-wringer-tray")).length, 0);
    assert.equal(ray.intersectObject(s.getObjectByName("bucket-shell")).length, 0);
    const hit = ray.intersectObject(s.getObjectByName("bucket-bottom"))[0];
    assert.ok(hit);
    assert.ok(Math.abs(hit.point.y - 0.018) < 0.00001);
    await r.unmount();
  });
  test("upright iron has a real handle aperture and the folded board rails attach to its brackets", async () => {
    const iron = await create(createElement(registry["upright-steam-iron"].component, {}));
    iron.scene.instance.updateMatrixWorld(true);
    assert.equal(
      new Raycaster(new Vector3(0, 0.18, 0.1), new Vector3(0, 0, -1)).intersectObject(
        iron.scene.instance.getObjectByName("iron-purple-handle"),
      ).length,
      0,
    );
    await iron.unmount();
    const board = await create(createElement(registry["folded-ironing-board"].component, {}));
    const s = board.scene.instance;
    s.updateMatrixWorld(true);
    const box = (name) => new Box3().setFromObject(s.getObjectByName(name));
    for (const height of [0.22, 1])
      for (const side of [-1, 1]) {
        assert.ok(
          box(`folded-board-bracket-${height}`).intersectsBox(box(`folded-board-rail-${side}`)),
        );
        assert.ok(box(`folded-board-bracket-${height}`).intersectsBox(box("folded-board-cover")));
      }
    await board.unmount();
  });
});
