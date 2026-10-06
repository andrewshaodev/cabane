import {
  BufferAttribute,
  type BufferGeometry,
  Material,
  Mesh,
  MeshToonMaterial,
  type InstancedMesh,
  NormalBlending,
  Object3D,
} from "three";

/** Conservative eligibility: preserve custom shaders, transparency and deformation. */
export function toonBatchKey(
  mesh: Mesh,
  allowInstances = false,
  cacheMembership = false,
): string | null {
  for (let parent = mesh.parent; parent; parent = parent.parent) {
    if (parent.type === "Group" && parent.renderOrder !== 0) return null;
  }
  const instances = mesh as InstancedMesh;
  if (instances.isInstancedMesh && (!allowInstances || instances.morphTexture)) return null;
  const material = mesh.material as MeshToonMaterial;
  if (Array.isArray(material) || !material.isMeshToonMaterial) return null;
  const fade = material.userData;
  const transparent = cacheMembership
    ? (fade.cameraFadeBaseTransparent ?? material.transparent)
    : material.transparent;
  const opacity = cacheMembership
    ? (fade.cameraFadeBaseOpacity ?? material.opacity)
    : material.opacity;
  const depthWrite = cacheMembership
    ? (fade.cameraFadeBaseDepthWrite ?? material.depthWrite)
    : material.depthWrite;
  const castShadow = cacheMembership
    ? (mesh.userData.cameraFadeBaseCastShadow ?? mesh.castShadow)
    : mesh.castShadow;
  if (
    mesh.type !== "Mesh" ||
    Array.isArray(material) ||
    !material.isMeshToonMaterial ||
    !material.visible ||
    transparent ||
    opacity !== 1 ||
    material.wireframe ||
    material.blending !== NormalBlending ||
    material.alphaTest ||
    material.alphaHash ||
    material.alphaToCoverage ||
    material.stencilWrite ||
    material.clippingPlanes?.length ||
    mesh.customDepthMaterial ||
    mesh.customDistanceMaterial ||
    mesh.morphTargetInfluences ||
    mesh.onBeforeRender !== Object3D.prototype.onBeforeRender ||
    mesh.onAfterRender !== Object3D.prototype.onAfterRender ||
    mesh.onBeforeShadow !== Object3D.prototype.onBeforeShadow ||
    mesh.onAfterShadow !== Object3D.prototype.onAfterShadow ||
    material.onBeforeCompile !== Material.prototype.onBeforeCompile ||
    material.customProgramCacheKey !== Material.prototype.customProgramCacheKey ||
    material.map ||
    material.alphaMap ||
    material.normalMap ||
    material.bumpMap ||
    material.displacementMap ||
    material.emissiveMap ||
    material.aoMap ||
    material.lightMap ||
    (!cacheMembership && mesh.matrixWorld.determinant() <= 0)
  )
    return null;
  // Three's batching normal transform supports scale/rotation, not shear.
  const e = mesh.matrixWorld.elements;
  for (const [a, b] of [
    [0, 4],
    [0, 8],
    [4, 8],
  ]) {
    const dot = e[a] * e[b] + e[a + 1] * e[b + 1] + e[a + 2] * e[b + 2];
    const aa = e[a] ** 2 + e[a + 1] ** 2 + e[a + 2] ** 2;
    const bb = e[b] ** 2 + e[b + 1] ** 2 + e[b + 2] ** 2;
    if (!cacheMembership && dot * dot > 1e-10 * aa * bb) return null;
  }
  const geometry = mesh.geometry;
  if (
    geometry.drawRange.start !== 0 ||
    geometry.drawRange.count <
      (geometry.index?.count ?? geometry.attributes.position?.count ?? 0) ||
    Object.keys(geometry.morphAttributes).length
  )
    return null;
  for (const name of material.vertexColors
    ? ["position", "normal", "color"]
    : ["position", "normal"]) {
    const attribute = geometry.attributes[name];
    if (
      !(attribute instanceof BufferAttribute) ||
      attribute.itemSize !== 3 ||
      !(attribute.array instanceof Float32Array) ||
      attribute.normalized
    )
      return null;
  }
  return [
    material.gradientMap?.uuid ?? "",
    material.emissive.getHexString(),
    material.emissiveIntensity,
    material.precision,
    material.vertexColors,
    material.side,
    material.shadowSide,
    material.depthTest,
    depthWrite,
    material.depthFunc,
    material.colorWrite,
    material.toneMapped,
    material.fog,
    material.dithering,
    material.polygonOffset,
    material.polygonOffsetFactor,
    material.polygonOffsetUnits,
    material.blending,
    material.premultipliedAlpha,
    castShadow,
    mesh.receiveShadow,
    mesh.layers.mask,
    mesh.renderOrder,
    mesh.frustumCulled,
  ].join("|");
}

type Revision = {
  index: BufferGeometry["index"];
  position: BufferGeometry["attributes"][string];
  normal: BufferGeometry["attributes"][string];
  color: BufferGeometry["attributes"][string];
  indexVersion?: number;
  positionVersion?: number;
  normalVersion?: number;
  colorVersion?: number;
  token: string;
};
const revisions = new WeakMap<BufferGeometry, Revision>();
let nextRevision = 0;
export function geometryRevision(input: Mesh | BufferGeometry): string {
  const geometry = (input as Mesh).geometry ?? (input as BufferGeometry);
  const {
    index,
    attributes: { position, normal, color },
  } = geometry;
  const pv = (position as BufferAttribute | undefined)?.version;
  const nv = (normal as BufferAttribute | undefined)?.version;
  const cv = (color as BufferAttribute | undefined)?.version;
  let revision = revisions.get(geometry);
  if (
    !revision ||
    revision.index !== index ||
    revision.indexVersion !== index?.version ||
    revision.position !== position ||
    revision.positionVersion !== pv ||
    revision.normal !== normal ||
    revision.normalVersion !== nv ||
    revision.color !== color ||
    revision.colorVersion !== cv
  ) {
    revision = {
      index,
      position,
      normal,
      color,
      indexVersion: index?.version,
      positionVersion: pv,
      normalVersion: nv,
      colorVersion: cv,
      token: String(++nextRevision),
    };
    revisions.set(geometry, revision);
  }
  return revision.token;
}
