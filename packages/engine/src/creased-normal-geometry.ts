import { BufferAttribute, type BufferGeometry } from "three";

const HASH_MULTIPLIER = (1 + 1e-10) * 1e2;
const vertexHash = (x: number, y: number, z: number) =>
  `${~~(x * HASH_MULTIPLIER)},${~~(y * HASH_MULTIPLIER)},${~~(z * HASH_MULTIPLIER)}`;

/**
 * Produces the same non-indexed geometry and crease normals as three-stdlib's
 * toCreasedNormals while calculating each face normal only once. Scene
 * outlines use Math.PI, so avoiding the generic helper's repeated Vector3
 * allocation and second face traversal materially shortens the first render.
 */
export function optimizedCreasedNormalGeometry(
  geometry: BufferGeometry,
  creaseAngle = Math.PI / 3,
): BufferGeometry {
  const creaseDot = Math.cos(creaseAngle);
  const resultGeometry = geometry.index ? geometry.toNonIndexed() : geometry;
  const positions = resultGeometry.getAttribute("position");
  const faceCount = positions.count / 3;
  const faceNormals = new Float64Array(faceCount * 3);
  const faceNormalIds = new Uint32Array(faceCount);
  const distinctNormals = new Map<string, number>();
  const vertexFaces = new Map<string, number[]>();
  const vertexHashes = new Array<string>(positions.count);

  for (let face = 0; face < faceCount; face += 1) {
    const vertex = face * 3;
    const ax = positions.getX(vertex);
    const ay = positions.getY(vertex);
    const az = positions.getZ(vertex);
    const bx = positions.getX(vertex + 1);
    const by = positions.getY(vertex + 1);
    const bz = positions.getZ(vertex + 1);
    const cx = positions.getX(vertex + 2);
    const cy = positions.getY(vertex + 2);
    const cz = positions.getZ(vertex + 2);

    const firstX = cx - bx;
    const firstY = cy - by;
    const firstZ = cz - bz;
    const secondX = ax - bx;
    const secondY = ay - by;
    const secondZ = az - bz;
    let normalX = firstY * secondZ - firstZ * secondY;
    let normalY = firstZ * secondX - firstX * secondZ;
    let normalZ = firstX * secondY - firstY * secondX;
    const normalScale =
      1 / (Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ) || 1);
    normalX *= normalScale;
    normalY *= normalScale;
    normalZ *= normalScale;

    const normalOffset = face * 3;
    faceNormals[normalOffset] = normalX;
    faceNormals[normalOffset + 1] = normalY;
    faceNormals[normalOffset + 2] = normalZ;
    const normalKey = `${normalX},${normalY},${normalZ}`;
    let normalId = distinctNormals.get(normalKey);
    if (normalId === undefined) {
      normalId = distinctNormals.size;
      distinctNormals.set(normalKey, normalId);
    }
    faceNormalIds[face] = normalId;

    for (let offset = 0; offset < 3; offset += 1) {
      const index = vertex + offset;
      const hash =
        offset === 0
          ? vertexHash(ax, ay, az)
          : offset === 1
            ? vertexHash(bx, by, bz)
            : vertexHash(cx, cy, cz);
      vertexHashes[index] = hash;
      const sharedFaces = vertexFaces.get(hash);
      if (sharedFaces) sharedFaces.push(face);
      else vertexFaces.set(hash, [face]);
    }
  }

  const fullySmoothNormals = new Map<string, [number, number, number]>();
  if (creaseAngle === Math.PI) {
    for (const [hash, sharedFaces] of vertexFaces) {
      let allFacesCompatible = true;
      for (let first = 0; first < sharedFaces.length && allFacesCompatible; first += 1) {
        const firstOffset = sharedFaces[first] * 3;
        for (let second = first + 1; second < sharedFaces.length; second += 1) {
          const secondOffset = sharedFaces[second] * 3;
          if (
            faceNormals[firstOffset] * faceNormals[secondOffset] +
              faceNormals[firstOffset + 1] * faceNormals[secondOffset + 1] +
              faceNormals[firstOffset + 2] * faceNormals[secondOffset + 2] <=
            creaseDot
          ) {
            allFacesCompatible = false;
            break;
          }
        }
      }
      if (!allFacesCompatible) continue;

      let normalX = 0;
      let normalY = 0;
      let normalZ = 0;
      for (const sharedFace of sharedFaces) {
        const sharedOffset = sharedFace * 3;
        normalX += faceNormals[sharedOffset];
        normalY += faceNormals[sharedOffset + 1];
        normalZ += faceNormals[sharedOffset + 2];
      }
      const normalScale =
        1 / (Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ) || 1);
      fullySmoothNormals.set(hash, [
        normalX * normalScale,
        normalY * normalScale,
        normalZ * normalScale,
      ]);
    }
  }

  const creasedNormals = new Map<string, Map<number, [number, number, number]>>();
  const normalArray = new Float32Array(positions.count * 3);
  const normalAttribute = new BufferAttribute(normalArray, 3, false);
  for (let face = 0; face < faceCount; face += 1) {
    const vertex = face * 3;
    const normalOffset = face * 3;
    const faceNormalX = faceNormals[normalOffset];
    const faceNormalY = faceNormals[normalOffset + 1];
    const faceNormalZ = faceNormals[normalOffset + 2];

    for (let offset = 0; offset < 3; offset += 1) {
      const index = vertex + offset;
      const hash = vertexHashes[index];
      const fullySmoothNormal = fullySmoothNormals.get(hash);
      if (fullySmoothNormal) {
        normalAttribute.setXYZ(index, ...fullySmoothNormal);
        continue;
      }
      // Identical face normals at the same quantized vertex have exactly the
      // same ordered neighborhood sum. Reuse it without rounding the normal.
      const normalId = faceNormalIds[face];
      let vertexNormals = creasedNormals.get(hash);
      const cachedNormal = vertexNormals?.get(normalId);
      if (cachedNormal) {
        normalAttribute.setXYZ(index, ...cachedNormal);
        continue;
      }
      const sharedFaces = vertexFaces.get(hash) ?? [];
      let normalX = 0;
      let normalY = 0;
      let normalZ = 0;

      for (const sharedFace of sharedFaces) {
        const sharedOffset = sharedFace * 3;
        const sharedX = faceNormals[sharedOffset];
        const sharedY = faceNormals[sharedOffset + 1];
        const sharedZ = faceNormals[sharedOffset + 2];
        if (faceNormalX * sharedX + faceNormalY * sharedY + faceNormalZ * sharedZ > creaseDot) {
          normalX += sharedX;
          normalY += sharedY;
          normalZ += sharedZ;
        }
      }

      const normalScale =
        1 / (Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ) || 1);
      const result: [number, number, number] = [
        normalX * normalScale,
        normalY * normalScale,
        normalZ * normalScale,
      ];
      if (!vertexNormals) {
        vertexNormals = new Map();
        creasedNormals.set(hash, vertexNormals);
      }
      vertexNormals.set(normalId, result);
      normalAttribute.setXYZ(index, ...result);
    }
  }

  resultGeometry.setAttribute("normal", normalAttribute);
  return resultGeometry;
}
