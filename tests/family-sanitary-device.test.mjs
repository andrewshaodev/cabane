import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { stableDeviceRegistry: models } = await load("/packages/catalog/src/device/index.ts");
  test("dense towel rail keeps its envelope and complexity in every connection state", async () => {
    for (const variant of ["dense-white", "dense-black"])
      for (const state of [
        "disconnected",
        "unavailable",
        "connected-inactive",
        "connected-active",
      ]) {
        const r = await create(
          createElement(models["heated-towel-rail"].component, {
            variant,
            visualState: state,
            reducedMotion: true,
            walkMode: false,
            onInteract() {},
            slot: {
              id: "fixture-rail",
              model: "heated-towel-rail",
              entitySlots: [],
              placement: { at: [0, 0], elevationMeters: 0, support: { kind: "wall" } },
            },
          }),
        );
        const s = r.scene.instance;
        s.updateMatrixWorld(true);
        const b = new Box3().setFromObject(s),
          ext = b.getSize(new Vector3()).toArray();
        let meshes = 0,
          tri = 0;
        s.traverse((o) => {
          if (o.isMesh && o.material.isMeshToonMaterial) {
            meshes++;
            tri += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
          }
        });
        if (
          ext.some((v, k) => Math.abs(v - [0.6, 1.2, 0.12][k]) > 0.001) ||
          meshes > 16 ||
          tri > 2000
        )
          throw Error("Dense rail envelope or complexity mismatch");
        await r.unmount();
      }
  });
});
