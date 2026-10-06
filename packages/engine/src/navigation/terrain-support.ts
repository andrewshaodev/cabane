import { Matrix3, Mesh, Raycaster, Vector3, type Intersection, type Object3D } from "three";
import { GROUND_ELEVATION_METERS } from "../ground-elevation";
import { WALK_PLAYER_RADIUS, type WalkPoint } from "./walk-navigation-contract";

/** Query existing terrain geometry, retaining its rounded edge and pool/stair cutouts. */
export function createTerrainSupportQuery(scene: Object3D) {
  const ray = new Raycaster(),
    down = new Vector3(0, -1, 0),
    normalMatrix = new Matrix3();
  const hits: Intersection[] = [];
  return (point: WalkPoint): boolean => {
    const terrain = scene.getObjectByName("diorama-ground") as Mesh | undefined;
    if (!terrain?.isMesh) return false;
    terrain.updateWorldMatrix(true, false);
    normalMatrix.getNormalMatrix(terrain.matrixWorld);
    for (let i = -1; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = point.x + (i < 0 ? 0 : Math.cos(angle) * WALK_PLAYER_RADIUS);
      const z = point.z + (i < 0 ? 0 : Math.sin(angle) * WALK_PLAYER_RADIUS);
      ray.set(new Vector3(x, GROUND_ELEVATION_METERS + 0.1, z), down);
      ray.far = 0.2;
      hits.length = 0;
      // Support is geometry, independent of a non-selected storey's disabled
      // interaction raycasts. This does not enable picking or mutate the mesh.
      Mesh.prototype.raycast.call(terrain, ray, hits);
      if (
        !hits.some(
          (hit) =>
            Math.abs(hit.point.y - GROUND_ELEVATION_METERS) < 0.01 &&
            (hit.face?.normal.clone().applyMatrix3(normalMatrix).normalize().y ?? 0) > 0.98,
        )
      )
        return false;
    }
    return true;
  };
}
