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
  test("platform fan guard stays mounted while the aperture remains open", async () => {
    for (const size of [
      [0.14, 0.03, 0.14],
      [0.1, 0.02, 0.1],
      [0.18, 0.04, 0.18],
    ]) {
      const renderer = await create(
        createElement(registry["guarded-platform-fan"].component, { size }),
      );
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const frame = scene.getObjectByName("platform-fan-mount");
      assert.ok(frame);
      assert.equal(
        new Raycaster(new Vector3(0, size[1], 0), new Vector3(0, -1, 0)).intersectObject(frame)
          .length,
        0,
        "real central aperture",
      );
      const bounds = new Box3().setFromObject(scene),
        extents = bounds.getSize(new Vector3());
      size.forEach((v, k) => assert.ok(Math.abs(extents.getComponent(k) - v) < 0.00001));
      for (const x of [-1, 1])
        for (const z of [-1, 1]) {
          const wire = scene.getObjectByName(`platform-fan-guard-leg-${x}:${z}`);
          const length = wire.geometry.parameters.height;
          const tip = wire.localToWorld(new Vector3(0, length / 2, 0));
          const hit = new Raycaster(
            tip.clone().add(new Vector3(0, 0.003, 0)),
            new Vector3(0, -1, 0),
          ).intersectObject(frame)[0];
          assert.ok(hit, "guard leg sits on frame corner");
          const gap = tip.y - hit.point.y;
          assert.ok(gap >= -0.001 && gap <= 0.00001, "guard mount seam");
          const guardTip = wire.localToWorld(new Vector3(0, -length / 2, 0));
          const normalizedRadius = Math.hypot(
            (guardTip.x * 0.14) / size[0],
            (guardTip.z * 0.14) / size[2],
          );
          assert.ok(Math.abs(normalizedRadius - 0.057) < 0.00001, "leg meets outer guard ring");
        }
      await renderer.unmount();
    }
  });
  test("round platform vent has a recessed open grille rather than a solid cap", async () => {
    const renderer = await create(createElement(registry["round-platform-vent"].component, {}));
    const scene = renderer.scene.instance;
    scene.updateMatrixWorld(true);
    const rim = scene.getObjectByName("platform-vent-rim");
    assert.equal(
      new Raycaster(new Vector3(0, 0.02, 0), new Vector3(0, -1, 0)).intersectObject(rim).length,
      0,
    );
    const rimTop = new Box3().setFromObject(rim).max.y;
    for (const index of [-2, -1, 0, 1, 2]) {
      const b = new Box3().setFromObject(scene.getObjectByName(`platform-vent-louver-${index}`));
      assert.ok(rimTop - b.max.y > 0.0009, "louvers recessed below rim");
    }
    await renderer.unmount();
  });
  test("laundry platform service cutouts stay open through the slab after resizing", async () => {
    for (const variant of ["default", "fan-right"])
      for (const size of [
        [2.55, 0.1, 0.65],
        [1.8, 0.08, 0.5],
        [3, 0.12, 0.8],
      ]) {
        const renderer = await create(
          createElement(registry["vented-laundry-platform"].component, { size, variant }),
        );
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const slab = scene.getObjectByName("laundry-platform-slab");
        const apertures =
          variant === "fan-right"
            ? [
                [-0.19 * size[0], 0.83 * size[2]],
                [0.19 * size[0], 0.85 * size[2]],
              ]
            : [
                [0.19 * size[0], 0.83 * size[2]],
                [-0.19 * size[0], 0.63 * size[2]],
                [-0.19 * size[0], 0.85 * size[2]],
              ];
        for (const [x, z] of apertures) {
          assert.equal(
            new Raycaster(new Vector3(x, size[1] + 0.01, z), new Vector3(0, -1, 0)).intersectObject(
              slab,
            ).length,
            0,
            "through cutout",
          );
        }
        if (variant === "fan-right")
          assert.ok(
            new Raycaster(
              new Vector3(0.19 * size[0], size[1] + 0.01, 0.63 * size[2]),
              new Vector3(0, -1, 0),
            ).intersectObject(slab).length,
            "no extra aperture behind the right fan",
          );
        const hit = new Raycaster(
          new Vector3(0, size[1] + 0.01, size[2] * 0.1),
          new Vector3(0, -1, 0),
        ).intersectObject(slab)[0];
        assert.ok(hit, "platform remains solid away from apertures");
        assert.ok(Math.abs(hit.point.y - size[1]) < 0.00001);
        const front = scene.getObjectByName("laundry-platform-front");
        const ray = (x, y) =>
          new Raycaster(
            new Vector3((x * size[0]) / 2.55, (y * size[1]) / 0.1, size[2] + 0.01),
            new Vector3(0, 0, -1),
          );
        for (const side of [-1, 1])
          for (let column = 0; column < 10; column++)
            assert.equal(
              ray(side * 0.38 * 2.55 + (column - 4.5) * 0.016, 0.04).intersectObject(front).length,
              0,
              "front linear perforations remain open",
            );
        for (let index = 0; index < 8; index++) {
          const angle = (index * Math.PI) / 4;
          assert.equal(
            ray(Math.cos(angle) * 0.025, 0.04 + Math.sin(angle) * 0.025).intersectObject(front)
              .length,
            0,
            "circular perforations remain open",
          );
        }
        assert.ok(ray(0.1, 0.04).intersectObject(front).length, "solid plinth between holes");
        const bounds = new Box3().setFromObject(scene);
        assert.ok(
          Math.abs(bounds.min.y) < 0.00001 && Math.abs(bounds.max.y - size[1]) < 0.00001,
          "unchanged platform floor and bearing height",
        );
        assert.ok(Math.abs(bounds.max.z - size[2]) < 0.00001, "unchanged front plane");
        await renderer.unmount();
      }
  });
});
