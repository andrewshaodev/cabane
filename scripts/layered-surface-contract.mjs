/** Offline checks: metadata alone never exempts an unsafe material from overlap detection. */
export function layeredSurfaceIssues(mesh) {
  const layer = mesh.userData.cabaneSurfaceLayer;
  if (layer === undefined) return [];
  const issues = [];
  if (!Number.isInteger(layer) || layer < 0 || layer > 64)
    issues.push("layer must be an integer from 0 to 64");
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  if (
    !materials.length ||
    materials.some(
      (material) =>
        !material?.isMeshToonMaterial ||
        !material.depthTest ||
        !material.depthWrite ||
        material.transparent ||
        material.opacity !== 1 ||
        !material.polygonOffset ||
        material.polygonOffsetFactor !== 0 ||
        material.polygonOffsetUnits !== -4 * layer,
    )
  )
    issues.push("layer must retain opaque depth-tested toon rendering and its assigned depth bias");
  const position = mesh.geometry?.attributes.position;
  if (
    !position ||
    Array.from({ length: position.count }, (_, i) => position.getZ(i)).some(
      (z) => !Number.isFinite(z) || Math.abs(z) > 1e-8,
    )
  )
    issues.push("layer geometry must lie on its local XY plane");
  return issues;
}

export function inspectLayeredSurfaces(scene) {
  const issues = [];
  scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    for (const message of layeredSurfaceIssues(mesh))
      issues.push({ surface: mesh.name || mesh.type, message });
  });
  return issues;
}
