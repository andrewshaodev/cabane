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
      const hull = renderer.scene.findByProps({ name: "robot-vacuum-lidar" }).parent;
      assert.equal(hull.instance.position.y, 1.5);
      await renderer.advanceFrames(10, 0.1);
      assert.equal(hull.instance.position.y, 1.5);
      await renderer.update(
        React.createElement(RobotVacuumModel, { ...props, reducedMotion: false }),
      );
      await renderer.advanceFrames(10, 0.1);
      assert.notEqual(hull.instance.rotation.y, 0);
      await renderer.update(
        React.createElement(RobotVacuumModel, {
          ...props,
          visualState: "connected-idle",
          state: { state: "docked" },
        }),
      );
      assert.equal(renderer.scene.findAllByProps({ name: "vacuum-tractor-beam" }).length, 0);
      assert.equal(hull.instance.position.y, 0);
    } finally {
      await renderer.unmount();
    }
  });
});
