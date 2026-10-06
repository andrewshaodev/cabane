import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const { stableFurnishingRegistry } = await load("/packages/catalog/src/furnishing/index.ts");
  test("wall lifting rack retains tray, rod and wall guide contacts across axis resizing", async () => {
    const definition = stableFurnishingRegistry["wall-lifting-drying-rack"];
    assert.equal(definition.preferredPlacement, "wall");
    for (const size of [
      [1.2, 1.6, 0.55],
      [0.8, 1.1, 0.35],
      [1.3, 1.8, 0.6],
    ]) {
      const renderer = await create(createElement(definition.component, { size }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const bounds = (name) => {
        const node = scene.getObjectByName(name);
        assert.ok(node, name);
        return new Box3().setFromObject(node);
      };
      const all = new Box3().setFromObject(scene);
      assert.ok(all.min.z >= -0.00001, "clear rear mounting plane");
      const extents = all.getSize(new Vector3());
      size.forEach((value, axis) =>
        assert.ok(Math.abs(extents.getComponent(axis) - value) < 0.001),
      );
      for (const level of ["lower", "upper"]) {
        const tray = `lifting-rack-${level}-tray`;
        const rods = [];
        scene.getObjectByName(tray).traverse((node) => {
          if (node.name.startsWith(`${tray}-rod-`)) rods.push(node);
        });
        assert.equal(rods.length, 9);
        for (const rod of rods)
          for (const side of [-1, 1]) {
            const end = rod.localToWorld(
              new Vector3(0, (side * rod.geometry.parameters.height) / 2, 0),
            );
            assert.ok(
              bounds(`${tray}-arm-${-side}`).expandByScalar(0.00002).containsPoint(end),
              "rod end meets tray arm",
            );
          }
        for (const side of [-1, 1]) {
          const bracket = bounds(`${tray}-rail-bracket-${side}`);
          assert.ok(
            bracket.intersectsBox(bounds(`lifting-rack-guide-${side}`)),
            "bracket meets guide",
          );
          assert.ok(bracket.intersectsBox(bounds(`${tray}-rear-brace`)), "bracket supports brace");
        }
      }
      assert.ok(
        bounds("lifting-rack-pulley").intersectsBox(bounds("lifting-rack-guide--1")),
        "reel is mounted",
      );
      assert.ok(
        bounds("lifting-rack-chain").intersectsBox(bounds("lifting-rack-pulley")),
        "chain meets pulley",
      );
      await renderer.unmount();
    }
  });
});
