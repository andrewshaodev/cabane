import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const { CeilingSurfaces } = await load(
    "/packages/engine/src/architecture-scene/CeilingSurfaces.tsx",
  );

  test("a single-room walk ceiling stays within its floor footprint", async () => {
    const footprint = [
      [-3.6, -3.2],
      [2.2, -3.2],
      [2.2, 0.2],
      [-3.6, 0.2],
    ];
    const floor = {
      id: "ground-floor",
      coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
      footprint,
      rooms: [{ id: "room", polygon: footprint }],
      ceilings: [{ id: "ceiling", kind: "flat", roomIds: ["room"], heightMeters: 2.4 }],
    };
    const renderer = await create(createElement(CeilingSurfaces, { floor }));
    try {
      const meshes = renderer.scene.findAllByType("Mesh");
      assert.equal(meshes.length, 1);
      const geometry = meshes[0].instance.geometry;
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      assert.ok(box.max.x - box.min.x <= 5.81, `ceiling width: ${box.max.x - box.min.x}`);
      assert.ok(box.max.y - box.min.y <= 3.41, `ceiling depth: ${box.max.y - box.min.y}`);
    } finally {
      await renderer.unmount();
    }
  });
});
