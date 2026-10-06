import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const architecture = await load("/packages/engine/src/architecture-geometry.ts");
  const fade = await load("/packages/engine/src/wall-fade.ts");
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");

  test("assigns each exposed wall cap to its local wall fade group", () => {
    const floor = neutralDemoManifest.floors[0];
    const assemblies = architecture.buildArchitecturalWallGeometries(floor);
    const capAssemblies = assemblies.filter(({ geometry }) => {
      const positions = geometry.getAttribute("position");
      const indices = geometry.index;
      for (let index = 0; index < indices.count; index += 3) {
        const ys = [0, 1, 2].map((offset) => {
          const vertex = indices.getX(index + offset);
          return positions.getY(vertex);
        });
        if (ys.every((y) => y > 0 && Math.abs(y - ys[0]) < 1e-6)) return true;
      }
      return false;
    });

    assert.ok(capAssemblies.length > 0);
    assert.ok(capAssemblies.every(({ fadeNormals }) => fadeNormals?.length === 1));
    assemblies.forEach(({ geometry }) => geometry.dispose());
  });

  test("uses the most transparent opacity for geometry shared by multiple normals", () => {
    const camera = [10, 10];
    const normals = [
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    const expected = Math.min(
      ...normals.map((normal) => fade.cameraFacingWallOpacity(true, camera, normal)),
    );

    assert.equal(fade.cameraFacingWallOpacityForNormals(true, camera, normals), expected);
    assert.equal(fade.cameraFacingWallOpacityForNormals(false, camera, normals), 1);
    assert.equal(fade.cameraFacingWallOpacityForNormals(true, camera, []), 1);
  });
});
