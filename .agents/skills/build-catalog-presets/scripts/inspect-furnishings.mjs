#!/usr/bin/env node
import { access } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const usage = "Usage: node inspect-furnishings.mjs [--project <cabane-root>] <model-id> [more-model-ids...]";
const tolerance = .001;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) { console.log(usage); return; }
  let project = process.cwd();
  const ids = [];
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--project") {
      if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(usage);
      project = resolve(args[++index]);
    } else if (args[index].startsWith("--")) throw new Error(`Unknown option: ${args[index]}\n${usage}`);
    else ids.push(args[index]);
  }
  if (!ids.length) throw new Error(usage);
  await access(join(project, "packages/catalog/src/furnishing/index.ts"));
  const require = createRequire(join(project, "package.json"));
  const { createElement } = require("react");
  const { create } = require("@react-three/test-renderer");
  const { Box3 } = require("three");
  const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const server = await createServer({
    root: project, appType: "custom", configFile: false, logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  const reports = [];
  try {
    const { stableFurnishingRegistry } = await server.ssrLoadModule("/packages/catalog/src/furnishing/index.ts");
    for (const id of new Set(ids)) {
      const definition = Object.hasOwn(stableFurnishingRegistry, id) && stableFurnishingRegistry[id];
      const issues = [];
      if (!definition) { reports.push({ id, issues: ["Not found in the stable furnishing registry."] }); continue; }
      let renderer;
      try {
        renderer = await create(createElement(definition.component, {
          size: definition.defaultSize, entityStatesBySlotId: {},
          reducedMotion: true, walkMode: false, onInteract() {},
        }));
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const box = new Box3().setFromObject(scene);
        const min = box.min.toArray();
        const max = box.max.toArray();
        const extents = max.map((value, axis) => value - min[axis]);
        let visibleMeshes = 0, triangles = 0;
        const nonToonMaterials = new Set();
        scene.traverse((object) => {
          if (!object.isMesh) return;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          // The engine's outline pass uses a shader material. It is neither a
          // solid surface nor part of the declared solid-mesh complexity.
          for (const material of materials) {
            if (!material.isMeshToonMaterial && !material.isShaderMaterial) nonToonMaterials.add(material.type);
          }
          if (!materials.some((material) => material.isMeshToonMaterial)) return;
          const instances = object.isInstancedMesh ? object.count : 1;
          visibleMeshes += instances;
          triangles += instances * (object.geometry.index?.count ?? object.geometry.attributes.position?.count ?? 0) / 3;
        });
        if (box.isEmpty() || ![...min, ...max].every(Number.isFinite)) issues.push("No finite renderable bounds.");
        if (!visibleMeshes) issues.push("No solid toon meshes found.");
        for (let axis = 0; axis < 3; axis++) {
          const name = ["width", "height", "depth"][axis];
          const declaredMin = definition.bounds.min[axis];
          const declaredMax = definition.bounds.max[axis];
          const declaredSize = definition.defaultSize[axis];
          if (![declaredMin, declaredMax, declaredSize].every(Number.isFinite) || declaredSize <= 0 || declaredMax <= declaredMin) {
            issues.push(`${name}: invalid declared bounds or size.`);
            continue;
          }
          if (min[axis] < declaredMin - tolerance || max[axis] > declaredMax + tolerance) issues.push(`${name}: geometry exceeds declared bounds.`);
          if (Math.abs(extents[axis] - declaredSize) > tolerance) issues.push(`${name}: rendered extent differs from defaultSize by more than 1 mm.`);
          if (Math.abs(declaredMax - declaredMin - declaredSize) > 1e-9) issues.push(`${name}: declared bound span differs from defaultSize.`);
        }
        if (nonToonMaterials.size) issues.push(`Non-toon surface materials: ${[...nonToonMaterials].join(", ")}.`);
        if (!Number.isInteger(definition.complexity?.visibleMeshes) || visibleMeshes > definition.complexity.visibleMeshes) issues.push("Measured meshes exceed a valid declared complexity limit.");
        if (!Number.isInteger(definition.complexity?.triangles) || triangles > definition.complexity.triangles) issues.push("Measured triangles exceed a valid declared complexity limit.");
        reports.push({ id, defaultSize: definition.defaultSize, measured: { min, max, extents, visibleMeshes, triangles }, declaredComplexity: definition.complexity, issues });
      } catch (error) {
        reports.push({ id, issues: [error.message] });
      } finally {
        if (renderer) await renderer.unmount();
      }
    }
  } finally {
    await server.close();
  }
  console.log(JSON.stringify({ toleranceMeters: tolerance, models: reports }, null, 2));
  if (reports.some((report) => report.issues.length)) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
