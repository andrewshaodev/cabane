import { Mesh, type Intersection, type Object3D, type Raycaster } from "three";

/** Restore against geometry even when another storey's interaction raycasts are disabled. */
export function createPortalSupportQuery(scene: Object3D) {
  const meshes: Mesh[] = [];
  scene.traverse((object) => {
    if (!(object as Mesh).isMesh) return;
    for (let ancestor: Object3D | null = object; ancestor; ancestor = ancestor.parent) {
      if (!ancestor.visible || ancestor.userData.walkToolVisual) return;
    }
    const mesh = object as Mesh;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (
      materials.every(
        (material) => !material.visible || (material.transparent && material.opacity === 0),
      )
    )
      return;
    meshes.push(mesh);
  });
  return (ray: Raycaster) => {
    const hits: Intersection[] = [];
    for (const mesh of meshes) Mesh.prototype.raycast.call(mesh, ray, hits);
    hits.sort((a, b) => a.distance - b.distance);
    return { hit: hits[0] ?? null };
  };
}
