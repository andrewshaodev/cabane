import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const { stableFurnishingRegistry } = await load("/packages/catalog/src/furnishing/index.ts");
  test("folding chair tubes join floor pads to the seat and back at independent axis sizes", async () => {
    const definition = stableFurnishingRegistry["white-folding-chair"];
    for (const scale of [[1,1,1], [.8,1.3,1.2]]) {
      const renderer = await create(createElement(definition.component, {
        size: definition.defaultSize.map((value, axis) => value * scale[axis]),
      }));
      try {
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const supports = [], feet = [], tops = [];
        scene.traverse(object => {
          if (object.name === "folding-chair-support") supports.push(object);
          if (object.name === "folding-chair-foot") feet.push(new Box3().setFromObject(object));
          if (["folding-chair-seat", "folding-chair-back-slat"].includes(object.name)) tops.push(new Box3().setFromObject(object));
        });
        assert.equal(supports.length, 4);
        for (const support of supports) {
          const half = support.geometry.parameters.height / 2;
          const bottom = support.localToWorld(new Vector3(0,-half,0));
          const top = support.localToWorld(new Vector3(0,half,0));
          assert.ok(feet.some(bounds => bounds.containsPoint(bottom)), "tube must meet a floor pad");
          assert.ok(tops.some(bounds => bounds.containsPoint(top)), "tube must meet the seat or back");
        }
        const bounds = new Box3().setFromObject(scene);
        assert.ok(Math.abs(bounds.min.y) < .001, "chair must remain grounded");
      } finally { await renderer.unmount(); }
    }
  });
});
