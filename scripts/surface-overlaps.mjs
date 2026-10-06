import { layeredSurfaceIssues } from "./layered-surface-contract.mjs";
import { Box3, Matrix4, Raycaster, Vector3 } from "three";

export const planeTolerance = 1e-5;
export const areaTolerance = 1e-8;
const quantize = (value) => Math.round(value / planeTolerance);
const cross2 = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
const area2 = (polygon) =>
  polygon.reduce((sum, point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0);

function project(point, dropAxis) {
  return dropAxis === 0
    ? [point.y, point.z]
    : dropAxis === 1
      ? [point.x, point.z]
      : [point.x, point.y];
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
      const startInside = startDistance >= -1e-12;
      const endInside = endDistance >= -1e-12;
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

function overlapPolygon(first, second) {
  const aa = first.projectedBounds,
    bb = second.projectedBounds;
  if (
    Math.min(aa[1], bb[1]) - Math.max(aa[0], bb[0]) <= planeTolerance ||
    Math.min(aa[3], bb[3]) - Math.max(aa[2], bb[2]) <= planeTolerance
  )
    return [];
  return clipPolygon(first.projected, second.projected);
}

function pointOnPlane(point, dropAxis, normal, distance) {
  if (dropAxis === 0)
    return new Vector3(
      (distance - normal.y * point[0] - normal.z * point[1]) / normal.x,
      point[0],
      point[1],
    );
  if (dropAxis === 1)
    return new Vector3(
      point[0],
      (distance - normal.x * point[0] - normal.z * point[1]) / normal.y,
      point[1],
    );
  return new Vector3(
    point[0],
    point[1],
    (distance - normal.x * point[0] - normal.y * point[1]) / normal.z,
  );
}

function surfaceIsExposed(scene, polygon, dropAxis, normal, distance, rayLength) {
  const centroid = polygon
    .reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
    .map((value) => value / polygon.length);
  const samples = [
    centroid,
    ...polygon.map((point) => [
      centroid[0] + (point[0] - centroid[0]) * 0.95,
      centroid[1] + (point[1] - centroid[1]) * 0.95,
    ]),
  ];
  return samples.some((sample) => {
    const surfacePoint = pointOnPlane(sample, dropAxis, normal, distance);
    const raycaster = new Raycaster(
      surfacePoint.clone().addScaledVector(normal, rayLength),
      normal.clone().negate(),
    );
    const firstToonHit = raycaster.intersectObject(scene, true).find(({ object }) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      return materials.some((material) => material?.isMeshToonMaterial);
    });
    return (
      firstToonHit && Math.abs(normal.dot(firstToonHit.point) - distance) <= planeTolerance * 2
    );
  });
}

function collectTriangles(scene) {
  const planes = new Map();
  scene.updateMatrixWorld(true);
  scene.traverseVisible((mesh) => {
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const layered =
      Number.isInteger(mesh.userData.cabaneSurfaceLayer) && layeredSurfaceIssues(mesh).length === 0;
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
      const meshBounds = new Box3().setFromBufferAttribute(position).applyMatrix4(matrix);
      const start = mesh.geometry.drawRange.start;
      const end = Math.min(index?.count ?? position.count, start + mesh.geometry.drawRange.count);
      for (let triangleIndex = start / 3; triangleIndex < end / 3; triangleIndex++) {
        const group = mesh.geometry.groups.find(
          ({ start, count }) => triangleIndex * 3 >= start && triangleIndex * 3 < start + count,
        );
        const material = Array.isArray(mesh.material)
          ? group && materials[group.materialIndex]
          : mesh.material;
        if (!material?.isMeshToonMaterial || !material.visible || material.opacity === 0) continue;
        const materialSignature = [
          material.color?.getHexString(),
          material.emissive?.getHexString(),
          material.emissiveIntensity,
          material.transparent,
          material.opacity,
          material.alphaHash,
          material.side,
          material.map?.uuid,
          material.vertexColors,
          material.depthTest,
          material.depthWrite,
          material.polygonOffset,
          material.polygonOffsetFactor,
          material.polygonOffsetUnits,
        ].join(":");
        const points = [0, 1, 2].map((offset) => {
          const vertexIndex = index
            ? index.getX(triangleIndex * 3 + offset)
            : triangleIndex * 3 + offset;
          return new Vector3().fromBufferAttribute(position, vertexIndex).applyMatrix4(matrix);
        });
        const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
        if (normal.lengthSq() < 1e-16) continue;
        normal.normalize();
        const distance = normal.dot(points[0]);
        const key = [normal.x, normal.y, normal.z, distance].map(quantize).join(":");
        const triangles = planes.get(key) ?? [];
        triangles.push({
          meshId,
          meshBounds,
          layered,
          layer: mesh.userData.cabaneSurfaceLayer,
          meshName: mesh.name || mesh.parent?.name || mesh.type,
          materialSignature,
          opaque:
            !material.transparent &&
            material.opacity === 1 &&
            !material.vertexColors &&
            !material.map,
          normal,
          points,
        });
        planes.set(key, triangles);
      }
    }
  });
  return planes;
}

export function findOverlaps(scene, definition) {
  const overlaps = new Map();
  const sceneBounds = new Box3().setFromObject(scene);
  const rayLength = sceneBounds.getSize(new Vector3()).length() + 1;
  for (const triangles of collectTriangles(scene).values()) {
    if (triangles.length < 2) continue;
    const normal = triangles[0].normal;
    const distance = normal.dot(triangles[0].points[0]);
    if (normal.y < -0.999 && Math.abs(distance / normal.y - sceneBounds.min.y) <= planeTolerance)
      continue;
    if (
      definition.preferredPlacement === "wall" &&
      normal.z < -0.999 &&
      Math.abs(distance / normal.z - definition.bounds.min[2]) <= planeTolerance
    )
      continue;
    const dropAxis =
      Math.abs(normal.x) > Math.abs(normal.y)
        ? Math.abs(normal.x) > Math.abs(normal.z)
          ? 0
          : 2
        : Math.abs(normal.y) > Math.abs(normal.z)
          ? 1
          : 2;
    for (const triangle of triangles) {
      triangle.projected = triangle.points.map((point) => project(point, dropAxis));
      triangle.projectedBounds = [
        Math.min(...triangle.projected.map((point) => point[0])),
        Math.max(...triangle.projected.map((point) => point[0])),
        Math.min(...triangle.projected.map((point) => point[1])),
        Math.max(...triangle.projected.map((point) => point[1])),
      ];
    }
    triangles.sort((a, b) => a.projectedBounds[0] - b.projectedBounds[0]);
    for (let firstIndex = 0; firstIndex < triangles.length; firstIndex++) {
      const first = triangles[firstIndex];
      for (let secondIndex = firstIndex + 1; secondIndex < triangles.length; secondIndex++) {
        const second = triangles[secondIndex];
        if (second.projectedBounds[0] >= first.projectedBounds[1] - planeTolerance) break;

        const duplicate =
          (first.meshId === second.meshId ||
            (first.meshBounds.min.distanceToSquared(second.meshBounds.min) < 1e-16 &&
              first.meshBounds.max.distanceToSquared(second.meshBounds.max) < 1e-16)) &&
          first.points.every((point) =>
            second.points.some((other) => point.distanceToSquared(other) < 1e-16),
          );
        // Identically shaded opaque structural joins cannot alternate appearance.
        // Exact duplicate faces and explicit artwork layers are still rejected.
        if (
          first.opaque &&
          second.opaque &&
          first.materialSignature === second.materialSignature &&
          !first.layered &&
          !second.layered &&
          !duplicate
        )
          continue;
        if (first.layered && second.layered && first.layer !== second.layer) continue;
        const polygon = overlapPolygon(first, second);
        const area = Math.abs(area2(polygon)) / 2;
        if (area <= areaTolerance) continue;
        if (
          !first.layered &&
          !second.layered &&
          !surfaceIsExposed(scene, polygon, dropAxis, normal, distance, rayLength)
        )
          continue;
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
