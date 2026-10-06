import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { stableFurnishingRegistry: models } = await load(
    "/packages/catalog/src/furnishing/index.ts",
  );
  test("toiletry cartons keep an open cavity and separate printed bands from case faces under resizing", async () => {
    const def = models["toiletry-carton"];
    for (const size of [def.defaultSize, [0.055, 0.17, 0.045]])
      for (const variant of ["default", "cream-open"]) {
        const renderer = await create(createElement(def.component, { size, variant })),
          scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const band = new Box3().setFromObject(scene.getObjectByName("carton-color-band"));
        const faces = [];
        scene.traverse((o) => {
          if (o.name === "carton-case" || o.name === "carton-face")
            faces.push(new Box3().setFromObject(o));
        });
        const front = faces.reduce((a, b) => (a.max.z > b.max.z ? a : b));
        assert.ok(Math.abs(band.min.z - front.max.z) < 1e-6, "band has a supported front face");
        assert.ok(band.max.z - front.max.z > 0.0002, "printed band is not coplanar with the case");
        if (variant === "cream-open") {
          const meshes = [];
          scene.traverse((o) => {
            if (o.isMesh) meshes.push(o);
          });
          const hit = new Raycaster(
            new Vector3(0, size[1] * 1.5, 0),
            new Vector3(0, -1, 0),
          ).intersectObjects(meshes, false)[0];
          assert.ok(hit && hit.point.y < 0.002, "top ray reaches inner carton floor");
          const flap = new Box3().setFromObject(scene.getObjectByName("carton-open-flap"));
          assert.ok(Math.abs(flap.min.y - front.max.y) < 1e-6, "flap meets rear wall top");
        }
        await renderer.unmount();
      }
  });
  test("squeeze tubes connect the cap, tapered body and closed crimp under independent resizing", async () => {
    const def = models["toiletry-tube"];
    for (const size of [def.defaultSize, [0.035, 0.22, 0.025]]) {
      const renderer = await create(createElement(def.component, { size })),
        scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const cap = new Box3().setFromObject(scene.getObjectByName("tube-cap")),
        body = new Box3().setFromObject(scene.getObjectByName("tube-body")),
        crimp = new Box3().setFromObject(scene.getObjectByName("tube-crimp"));
      assert.ok(Math.abs(cap.max.y - body.min.y) < 1e-6);
      assert.ok(Math.abs(body.max.y - crimp.min.y) < 1e-6);
      assert.ok(Math.abs(cap.min.y) < 1e-6 && Math.abs(crimp.max.y - size[1]) < 1e-6);
      await renderer.unmount();
    }
  });
  test("cotton packet tips contact both ends of every swab and stay inside the packet after resizing", async () => {
    const def = models["cotton-swab-pack"];
    for (const size of [def.defaultSize, [0.11, 0.012, 0.075]]) {
      const renderer = await create(createElement(def.component, { size })),
        scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const shafts = scene.getObjectByName("swab-shafts"),
        tips = scene.getObjectByName("swab-cotton-tips"),
        packet = new Box3().setFromObject(scene.getObjectByName("swab-packet"));
      assert.ok(
        packet.containsBox(new Box3().setFromObject(shafts)) &&
          packet.containsBox(new Box3().setFromObject(tips)),
      );
      for (let row = 0; row < 12; row++)
        for (const side of [-1, 1]) {
          const origin = new Vector3(
              0,
              (0.004 * size[1]) / 0.016,
              ((row - 5.5) * 0.0055 * size[2]) / 0.08,
            ),
            direction = new Vector3(side, 0, 0);
          const hit = new Raycaster(origin, direction).intersectObject(tips, false)[0];
          assert.ok(
            hit && Math.abs(hit.distance - (0.043 * size[0]) / 0.14) < 1e-6,
            "tip meets shaft endpoint",
          );
        }
      await renderer.unmount();
    }
  });
  test("shower puff hanging loop meets the soft body at every supported size", async () => {
    const def = models["bath-pouf"];
    for (const size of [def.defaultSize, [0.1, 0.12, 0.09]]) {
      const renderer = await create(createElement(def.component, { size })),
        scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const loop = new Box3().setFromObject(scene.getObjectByName("pouf-hanging-loop")),
        folds = [];
      scene.traverse((o) => {
        if (o.name === "pouf-fold") folds.push(new Box3().setFromObject(o));
      });
      assert.ok(
        folds.some((b) => b.intersectsBox(loop)),
        "loop has a real body contact",
      );
      assert.ok(Math.abs(loop.max.y - size[1]) < 1e-6);
      await renderer.unmount();
    }
  });
});
