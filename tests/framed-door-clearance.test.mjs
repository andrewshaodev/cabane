import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Matrix4, Triangle, Vector3 } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const engine = await load("/packages/engine/src/index.ts");
  const { stableArchitectureModelRegistry } = await load(
    "/packages/catalog/src/architecture/index.ts",
  );
  const floor = structuredClone(engine.neutralDemoManifest.floors[0]);
  const base = floor.openings.find((o) => o.kind === "door");
  const wall = { ...floor.walls[0], from: [1, 1], to: [5, 4], thicknessMeters: 0.07 };
  test("framed leaves and handles clear every jamb throughout the actual animation on both swing sides and hinges", async () => {
    for (const variant of ["panel", "panel-white-lever", "french", "plank"]) {
      for (const leafCount of [1, 2]) {
        for (const [openingWidth, wallThickness] of [
          [leafCount === 1 ? 0.69 : 1.4, 0.07],
          [0.3, 0.2],
        ]) {
          for (const openingSide of ["left", "right"]) {
            for (const hingeSide of leafCount === 1 ? ["start", "end"] : ["start"]) {
              const opening = {
                ...base,
                widthPlanUnits: openingWidth,
                offsetFromWallStartPlanUnits: 0.2,
                openingHeightMeters: 2.1,
                variant,
                leafCount,
                openingSide,
                hingeSide,
                operation: "hinged",
              };
              const render = (position, reducedMotion) =>
                createElement(stableArchitectureModelRegistry.door, {
                  floor,
                  wall: { ...wall, thicknessMeters: wallThickness },
                  opening,
                  position,
                  reducedMotion,
                });
              const renderer = await create(render(0, true));
              const scene = renderer.scene.instance;
              const frames = [],
                moving = [];
              scene.traverse((o) => {
                if (!o.isMesh || !o.material?.isMeshToonMaterial) return;
                if (o.name.startsWith("opening-door-frame-")) frames.push(o);
                else moving.push(o);
              });
              assert.equal(frames.length, 3);
              await renderer.update(render(1, false));
              const motions = [];
              scene.traverse((o) => {
                if (o.name === "opening-leaf-motion") motions.push(o);
              });
              for (let step = 0; step <= 65; step++) {
                if (step === 65) {
                  await renderer.update(render(1, true));
                  await renderer.advanceFrames(1, 0.016);
                } else if (step) await renderer.advanceFrames(1, 0.016);
                scene.updateMatrixWorld(true);
                for (const frame of frames) {
                  frame.geometry.computeBoundingBox();
                  const box = frame.geometry.boundingBox.clone().expandByScalar(-0.00001);
                  const inverse = frame.matrixWorld.clone().invert();
                  for (const mesh of moving) {
                    const transform = new Matrix4().multiplyMatrices(inverse, mesh.matrixWorld);
                    const vertices = mesh.geometry.attributes.position,
                      indices = mesh.geometry.index;
                    const count = indices ? indices.count : vertices.count;
                    for (let offset = 0; offset < count; offset += 3) {
                      const points = [0, 1, 2].map((i) =>
                        new Vector3()
                          .fromBufferAttribute(
                            vertices,
                            indices ? indices.getX(offset + i) : offset + i,
                          )
                          .applyMatrix4(transform),
                      );
                      assert.ok(
                        !box.intersectsTriangle(new Triangle(...points)),
                        `${variant}/${leafCount}/${openingSide}/${hingeSide} step${step} ${mesh.name || mesh.parent.name || mesh.geometry.type} localPos=${mesh.position.toArray()} enters${frame.name}`,
                      );
                    }
                  }
                }
              }
              assert.ok(
                motions.every((m) => Math.abs(m.rotation.y) > 1.5),
                "animation reaches its normal fully-open angle",
              );
              await renderer.unmount();
            }
          }
        }
      }
    }
  });
});
