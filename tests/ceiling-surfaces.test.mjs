import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const { CeilingSurfaces } = await load(
    "/packages/engine/src/architecture-scene/CeilingSurfaces.tsx",
  );
  const { PlatformSlab } = await load("/packages/engine/src/outdoor-platforms/PlatformSlab.tsx");

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

  test("an upper outdoor platform retains the lower room ceiling underside", async () => {
    const polygon = [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ];
    const below = {
      id: "lower",
      coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" },
      footprint: polygon,
      rooms: [{ id: "living", polygon }],
      ceilings: [{ id: "living-ceiling", kind: "flat", roomIds: ["living"], heightMeters: 3 }],
      defaultCeilingHeightMeters: 3,
      floorToFloorHeightMeters: 3.2,
    };
    const platform = {
      id: "upper-balcony",
      polygon,
      finish: { kind: "preset", preset: "travertine" },
      defaultEdge: { kind: "railing", heightMeters: 1 },
      edges: polygon.map((_, index) => ({ id: `upper-balcony:edge-${index}` })),
    };
    const upper = { ...below, id: "upper", outdoorPlatforms: [platform] };
    const ceilingRenderer = await create(createElement(CeilingSurfaces, { floor: below }));
    const platformRenderer = await create(
      createElement(PlatformSlab, { platform, floor: upper, below }),
    );
    try {
      const ceilingMaterial = ceilingRenderer.scene.findByType("Mesh").instance.material;
      const structure = platformRenderer.scene.findByProps({
        name: "platform-slab-upper-balcony-structure-0",
      }).instance;
      const liner = platformRenderer.scene.findByProps({
        name: "platform-slab-upper-balcony-ceiling-0",
      }).instance;
      structure.updateMatrixWorld(true);
      liner.updateMatrixWorld(true);
      const [undersideHit] = new Raycaster(
        new Vector3(2, -2, 2),
        new Vector3(0, 1, 0),
      ).intersectObject(liner);
      assert.ok(undersideHit, "an upward view must hit the platform underside");
      assert.equal(
        `#${liner.material.color.getHexString()}`,
        `#${ceilingMaterial.color.getHexString()}`,
      );
      assert.equal(liner.receiveShadow, false);
      assert.equal(structure.receiveShadow, true);
      assert.ok(liner.position.y < structure.position.y);
    } finally {
      await ceilingRenderer.unmount();
      await platformRenderer.unmount();
    }
  });
});
