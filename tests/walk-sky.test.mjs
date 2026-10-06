import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const { SolarLighting } = await load("/packages/engine/src/SceneLighting.tsx");
  const { deriveSolarLighting } = await load("/packages/engine/src/lighting.ts");
  const { transitionSolarDirection } = await load("/packages/engine/src/solar-direction-transition.ts");

  await test("sun transitions remain finite and nonzero across opposite directions and azimuth wrap", () => {
    for (const [start, end] of [
      [[18, 0, 0], [-18, 0, 0]],
      [[18, 0, -0.01], [18, 0, 0.01]],
      [[0, 18, 0], [0, -18, 0]],
    ]) {
      const current = new Vector3(...start);
      const target = new Vector3(...end);
      for (let i = 0; i < 100; i++) {
        transitionSolarDirection(current, target, 0.5);
        assert.ok(current.toArray().every(Number.isFinite));
        assert.ok(current.length() > 17.9);
      }
      assert.ok(current.distanceTo(target) < 0.001);
    }
  });

  await test("Walk sky follows rendered solar state, fallback, and mode transitions", async () => {
    const props = { mode: "day", shadowMapSize: 1024, walkMode: true };
    const renderer = await create(createElement(SolarLighting, props));
    try {
      for (const input of [
        { mode: "day" }, { mode: "night" }, { mode: "live" },
        { mode: "live", sunState: { state: "unknown", attributes: { elevation: "bad" } } },
        ...[-8, -1, 0, 4, 35].map(elevation => ({ mode: "live", sunState: {
          state: "above_horizon", attributes: { azimuth: 359, elevation },
        } })),
      ]) {
        await renderer.update(createElement(SolarLighting, { ...props, ...input }));
        await renderer.advanceFrames(1, 1 / 60);
        const sky = renderer.scene.findByProps({ name: "walk-sky" }).instance;
        const sun = renderer.scene.children.find(node => node.instance.isDirectionalLight).instance;
        assert.ok(sky.material.uniforms.sunDirection.value.distanceTo(sun.position.clone().normalize()) < 1e-6);
        assert.equal(sky.material.depthWrite, false);
        assert.equal(sky.castShadow, false);
        assert.equal(sky.frustumCulled, false);
        await renderer.advanceFrames(180, 1 / 60);
        const expected = deriveSolarLighting(input.sunState, input.mode);
        assert.ok(sun.position.distanceTo(new Vector3(...expected.sunPosition)) < 0.01);
        assert.ok(sky.material.uniforms.sunColor.value.equals(sun.color));
      }
      await renderer.update(createElement(SolarLighting, { ...props, walkMode: false }));
      assert.equal(renderer.scene.findAllByProps({ name: "walk-sky" }).length, 0);
    } finally { await renderer.unmount(); }
  });
});
