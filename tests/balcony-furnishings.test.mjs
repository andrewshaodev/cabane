import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { stableFurnishingRegistry: registry } = await load(
    "/packages/catalog/src/furnishing/index.ts",
  );
  for (const id of ["slatted-folding-table", "slatted-folding-chair", "retractable-awning"]) {
    test(`${id} connects folding strips to their actual supports under allowed resizing`, async () => {
      const model = registry[id];
      for (const size of [
        model.defaultSize,
        ...[0, 1, 2].map((axis) =>
          model.defaultSize.map((value, index) => (index === axis ? value * 1.3 : value)),
        ),
      ]) {
        const renderer = await create(createElement(model.component, { size }));
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const meshes = [];
        scene.traverse((o) => {
          if (o.isMesh) meshes.push(o);
        });
        const supportNames =
          id === "slatted-folding-table"
            ? ["bistro-table-foot", "bistro-table-top-crossbar"]
            : id === "slatted-folding-chair"
              ? ["bistro-chair-foot", "bistro-chair-seat-crossbar", "bistro-chair-back-slat"]
              : ["awning-mount", "awning-front-rail"];
        const strips = meshes.filter((o) => o.userData.frameEndpoints);
        assert.equal(strips.length, 4);
        const supported = (point) =>
          meshes
            .filter((o) => supportNames.includes(o.name))
            .some((o) => new Box3().setFromObject(o).expandByScalar(0.0001).containsPoint(point));
        const ends = (strip) =>
          [-1, 1].map((sign) =>
            strip.localToWorld(new Vector3(0, (sign * strip.geometry.parameters.height) / 2, 0)),
          );
        for (const strip of strips) {
          const points = ends(strip);
          if (id !== "retractable-awning") {
            assert.ok(supported(points[0]), "foot endpoint meets a real floor pad");
            assert.ok(supported(points[1]), "upper endpoint meets top/seat/back support");
          } else {
            assert.ok(points.some(supported), "arm meets its wall mount or front rail");
            const knee = points.find((point) => !supported(point));
            assert.ok(
              strips.some(
                (other) =>
                  other !== strip && ends(other).some((point) => point.distanceTo(knee) < 0.00001),
              ),
              "both articulated arm pieces share a knee joint",
            );
          }
        }
        const bounds = new Box3().setFromObject(scene);
        const dimensions = bounds.getSize(new Vector3()).toArray();
        dimensions.forEach((v, index) =>
          assert.ok(Math.abs(v - size[index]) < 0.001, `complete resized envelope axis${index}`),
        );
        if (id === "slatted-folding-chair") {
          assert.equal(meshes.filter((o) => o.name === "bistro-chair-back-slat").length, 2);
          assert.equal(meshes.filter((o) => o.name === "bistro-chair-seat-slat").length, 5);
        }
        await renderer.unmount();
      }
    });
  }
});
