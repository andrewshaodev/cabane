#!/usr/bin/env node
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { createElement } = require("react");
const { create } = require("@react-three/test-renderer");
const { Box3, Matrix4, Raycaster, Vector3 } = require("three");
const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const originalWarn = console.warn;
console.warn = (...args) => {
  if (String(args[0]).startsWith("THREE.Clock:")) return;
  originalWarn(...args);
};

const planeTolerance = 1e-5;
const areaTolerance = 1e-8;
const requestedModelIds = new Set(process.argv.slice(2));
const quantize = (value) => Math.round(value / planeTolerance);
const cross2 = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
const area2 = (polygon) => polygon.reduce((sum, point, index) => {
  const next = polygon[(index + 1) % polygon.length];
  return sum + point[0] * next[1] - next[0] * point[1];
}, 0);

function project(point, dropAxis) {
  return dropAxis === 0 ? [point.y, point.z] : dropAxis === 1 ? [point.x, point.z] : [point.x, point.y];
}

function clipPolygon(subject, clip) {
  const winding = Math.sign(area2(clip)) || 1;
  let output = subject;
  for (let edge = 0; edge < clip.length; edge++) {
    const a = clip[edge];
    const b = clip[(edge + 1) % clip.length];
    const input = output;
    output = [];
    if (!input.length) break;
    for (let index = 0; index < input.length; index++) {
      const start = input[index];
      const end = input[(index + 1) % input.length];
      const startDistance = winding * cross2(a, b, start);
      const endDistance = winding * cross2(a, b, end);
      const startInside = startDistance >= -planeTolerance;
      const endInside = endDistance >= -planeTolerance;
      if (startInside) output.push(start);
      if (startInside !== endInside) {
        const ratio = startDistance / (startDistance - endDistance);
        output.push([
          start[0] + (end[0] - start[0]) * ratio,
          start[1] + (end[1] - start[1]) * ratio,
        ]);
      }
    }
  }
  return output;
}

function overlapPolygon(first, second, dropAxis) {
  const a = first.points.map((point) => project(point, dropAxis));
  const b = second.points.map((point) => project(point, dropAxis));
  const bounds = (triangle) => [
    Math.min(...triangle.map((point) => point[0])), Math.max(...triangle.map((point) => point[0])),
    Math.min(...triangle.map((point) => point[1])), Math.max(...triangle.map((point) => point[1])),
  ];
  const aa = bounds(a), bb = bounds(b);
  if (Math.min(aa[1], bb[1]) - Math.max(aa[0], bb[0]) <= planeTolerance ||
      Math.min(aa[3], bb[3]) - Math.max(aa[2], bb[2]) <= planeTolerance) return [];
  return clipPolygon(a, b);
}

function pointOnPlane(point, dropAxis, normal, distance) {
  if (dropAxis === 0) return new Vector3(
    (distance - normal.y * point[0] - normal.z * point[1]) / normal.x, point[0], point[1],
  );
  if (dropAxis === 1) return new Vector3(
    point[0], (distance - normal.x * point[0] - normal.z * point[1]) / normal.y, point[1],
  );
  return new Vector3(
    point[0], point[1], (distance - normal.x * point[0] - normal.y * point[1]) / normal.z,
  );
}

function surfaceIsExposed(scene, polygon, dropAxis, normal, distance, rayLength) {
  const centroid = polygon.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
    .map((value) => value / polygon.length);
  const samples = [centroid, ...polygon.map((point) => [
    centroid[0] + (point[0] - centroid[0]) * .95,
    centroid[1] + (point[1] - centroid[1]) * .95,
  ])];
  return samples.some((sample) => {
    const surfacePoint = pointOnPlane(sample, dropAxis, normal, distance);
    const raycaster = new Raycaster(surfacePoint.clone().addScaledVector(normal, rayLength), normal.clone().negate());
    const firstToonHit = raycaster.intersectObject(scene, true).find(({ object }) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      return materials.some((material) => material?.isMeshToonMaterial);
    });
    return firstToonHit && Math.abs(normal.dot(firstToonHit.point) - distance) <= planeTolerance * 2;
  });
}

function collectTriangles(scene) {
  const planes = new Map();
  scene.updateMatrixWorld(true);
  scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const material = materials.find((candidate) => candidate?.isMeshToonMaterial);
    if (!material) return;
    const materialSignature = [
      material.color?.getHexString(), material.transparent,
      material.opacity, material.alphaHash, material.side,
    ].join(":");
    const position = mesh.geometry.attributes.position;
    if (!position) return;
    const index = mesh.geometry.index;
    const instanceCount = mesh.isInstancedMesh ? mesh.count : 1;
    for (let instanceIndex = 0; instanceIndex < instanceCount; instanceIndex++) {
      const matrix = mesh.matrixWorld.clone();
      if (mesh.isInstancedMesh) {
        const instanceMatrix = new Matrix4();
        mesh.getMatrixAt(instanceIndex, instanceMatrix);
        matrix.multiply(instanceMatrix);
      }
      const meshId = `${mesh.uuid}:${instanceIndex}`;
      const triangleCount = (index?.count ?? position.count) / 3;
      for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex++) {
        const points = [0, 1, 2].map((offset) => {
          const vertexIndex = index ? index.getX(triangleIndex * 3 + offset) : triangleIndex * 3 + offset;
          return new Vector3().fromBufferAttribute(position, vertexIndex).applyMatrix4(matrix);
        });
        const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
        if (normal.lengthSq() < 1e-16) continue;
        normal.normalize();
        const distance = normal.dot(points[0]);
        const key = [normal.x, normal.y, normal.z, distance].map(quantize).join(":");
        const triangles = planes.get(key) ?? [];
        triangles.push({
          meshId, meshName: mesh.name || mesh.parent?.name || mesh.type,
          materialSignature, normal, points,
        });
        planes.set(key, triangles);
      }
    }
  });
  return planes;
}

function findOverlaps(scene, definition) {
  const overlaps = new Map();
  const sceneBounds = new Box3().setFromObject(scene);
  const rayLength = sceneBounds.getSize(new Vector3()).length() + 1;
  for (const triangles of collectTriangles(scene).values()) {
    if (triangles.length < 2) continue;
    const normal = triangles[0].normal;
    const distance = normal.dot(triangles[0].points[0]);
    if (normal.y < -.999 && Math.abs(distance / normal.y - sceneBounds.min.y) <= planeTolerance) continue;
    if (definition.preferredPlacement === "wall" && normal.z < -.999 &&
        Math.abs(distance / normal.z - definition.bounds.min[2]) <= planeTolerance) continue;
    const dropAxis = Math.abs(normal.x) > Math.abs(normal.y)
      ? (Math.abs(normal.x) > Math.abs(normal.z) ? 0 : 2)
      : (Math.abs(normal.y) > Math.abs(normal.z) ? 1 : 2);
    for (let firstIndex = 0; firstIndex < triangles.length; firstIndex++) {
      const first = triangles[firstIndex];
      for (let secondIndex = firstIndex + 1; secondIndex < triangles.length; secondIndex++) {
        const second = triangles[secondIndex];
        if (first.meshId === second.meshId || first.materialSignature === second.materialSignature) continue;
        const polygon = overlapPolygon(first, second, dropAxis);
        const area = Math.abs(area2(polygon)) / 2;
        if (area <= areaTolerance) continue;
        if (!surfaceIsExposed(scene, polygon, dropAxis, normal, distance, rayLength)) continue;
        const surfaces = [
          `${first.meshName} [${first.materialSignature}]`,
          `${second.meshName} [${second.materialSignature}]`,
        ].sort();
        const key = surfaces.join(" ↔ ");
        const previous = overlaps.get(key);
        if (!previous || area > previous.overlapAreaSquareMeters) {
          overlaps.set(key, {
            surfaces,
            plane: { normal: normal.toArray(), distance },
            overlapAreaSquareMeters: area,
          });
        }
      }
    }
  }
  return [...overlaps.values()];
}

const server = await createServer({
  root: process.cwd(), appType: "custom", configFile: false, logLevel: "error",
  server: { middlewareMode: true, hmr: false, ws: false },
});
const reports = [];
try {
  const { stableFurnishingRegistry } = await server.ssrLoadModule("/packages/catalog/src/furnishing/index.ts");
  for (const [modelId, definition] of Object.entries(stableFurnishingRegistry)) {
    if (requestedModelIds.size && !requestedModelIds.has(modelId)) continue;
    const variants = definition.variants?.map(({ id }) => id) ?? [undefined];
    for (const variant of variants) {
      let renderer;
      try {
        renderer = await create(createElement(definition.component, {
          size: definition.defaultSize, variant, entityStatesBySlotId: {},
          reducedMotion: true, walkMode: false, onInteract() {},
        }));
        const overlaps = findOverlaps(renderer.scene.instance, definition);
        if (overlaps.length) reports.push({ modelId, variant, overlaps });
      } finally {
        if (renderer) await renderer.unmount();
      }
    }
  }
} finally {
  await server.close();
}

console.log(JSON.stringify({ planeTolerance, areaTolerance, reports }, null, 2));
if (reports.length) process.exitCode = 1;
