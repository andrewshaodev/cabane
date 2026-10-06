import assert from "node:assert/strict";
import test from "node:test";
import { createElement, useEffect } from "react";
import { create } from "@react-three/test-renderer";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async load => {
  const { RetainedArrangeScene } = await load("/apps/web/src/editor-workspace/RetainedArrangeScene.tsx");
  test("Arrange retains geometry while hidden and receives edits on return", async () => {
    let mounts = 0, unmounts = 0, renders = 0;
    function Model({ size }) {
      renders++;
      useEffect(() => { mounts++; return () => { unmounts++; }; }, []);
      return createElement("mesh", { name: "probe" }, createElement("boxGeometry", { args: [size, 1, 1] }));
    }
    const scene = (active, size) => createElement(RetainedArrangeScene, { active }, createElement(Model, { size }));
    const renderer = await create(scene(false, 1));
    try {
      assert.equal(mounts, 0, "Construct must not eagerly build the 3D home");
      await renderer.update(scene(true, 1));
      const mesh = renderer.scene.findByProps({ name: "probe" }).instance;
      const geometry = mesh.geometry;
      const initialRenders = renders;
      await renderer.update(scene(false, 2));
      assert.equal(renderer.scene.findByProps({ name: "retained-arrange-scene" }).instance.visible, false);
      assert.equal(renders, initialRenders, "hidden architecture must not rebuild for Construct edits");
      assert.equal(mesh.geometry, geometry);
      await renderer.update(scene(true, 1));
      assert.equal(mesh.geometry, geometry, "unchanged visits must retain GPU geometry");
      await renderer.update(scene(false, 2));
      await renderer.update(scene(true, 2));
      assert.equal(mesh.geometry.parameters.width, 2, "returning must show the current draft");
      assert.equal(mounts, 1);
      assert.equal(unmounts, 0);
    } finally { await renderer.unmount(); }
    assert.equal(unmounts, 1, "leaving the editor must release retained models");
  });
});
