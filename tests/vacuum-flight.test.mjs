import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { create } from "@react-three/test-renderer";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { RobotVacuumModel } = await load(
    "/packages/catalog/src/device/presets/appliances/robot-vacuum.tsx",
  );
  test("vacuum flies only while cleaning, with reduced-motion-safe beam and grounded idle state", async () => {
    const props = {
      visualState: "connected-active",
      reducedMotion: true,
      state: { state: "cleaning" },
    };
    const renderer = await create(React.createElement(RobotVacuumModel, props));
    try {
      assert.ok(renderer.scene.findByProps({ name: "vacuum-tractor-beam" }));
      const batches = renderer.scene.findAll((node) => node.instance.isInstancedMesh);
      assert.deepEqual(
        batches.map((node) => node.instance.count).sort((a, b) => a - b),
        [8, 16],
      );
      const hull = renderer.scene.findByProps({ name: "robot-vacuum-lidar" }).parent;
      assert.equal(hull.instance.position.y, 1.5);
      await renderer.advanceFrames(10, 0.1);
      assert.equal(hull.instance.position.y, 1.5);
      await renderer.update(
        React.createElement(RobotVacuumModel, { ...props, reducedMotion: false }),
      );
      await renderer.advanceFrames(10, 0.1);
      assert.notEqual(hull.instance.rotation.y, 0);
      const drift = renderer.scene.findByProps({ name: "catalog-robot-vacuum" }).instance;
      assert.notEqual(drift.position.x, 0);
      assert.notEqual(drift.position.z, 0);
      for (let frame = 0; frame < 400; frame++) {
        await renderer.advanceFrames(1, 0.05);
        assert.ok(Math.abs(drift.position.x) <= 0.75);
        assert.ok(Math.abs(drift.position.z) <= 0.75);
      }
      await renderer.update(React.createElement(RobotVacuumModel, props));
      assert.equal(drift.position.length(), 0);
      await renderer.advanceFrames(10, 0.05);
      assert.equal(drift.position.length(), 0);
      await renderer.update(
        React.createElement(RobotVacuumModel, {
          ...props,
          visualState: "connected-idle",
          state: { state: "docked" },
        }),
      );
      assert.equal(renderer.scene.findAllByProps({ name: "vacuum-tractor-beam" }).length, 0);
      assert.equal(hull.instance.position.y, 0);
      assert.equal(drift.position.length(), 0);
    } finally {
      await renderer.unmount();
    }
  });
});
