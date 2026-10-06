import type { BufferGeometry } from "three";
import { pointInsidePolygon, worldPointToPlan } from "../geometry";
import type { FloorSpec } from "../types";

export const roomSurfaceEmphasis = (
  enabled: boolean,
  selectedId: string | null,
  roomId: string | null,
) => (!enabled ? 1 : !selectedId ? 0.96 : selectedId === roomId ? 1.04 : 0.9);

/** Tag each merged wall face once, sampling on its visible side of a shared wall. */
export function wallFaceRoomIds(geometry: BufferGeometry, floor: FloorSpec): (string | null)[] {
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const result: (string | null)[] = Array.from({ length: positions.count }, () => null);
  for (let index = 0; index < positions.count; index += 3) {
    const x = (positions.getX(index) + positions.getX(index + 1) + positions.getX(index + 2)) / 3;
    const z = (positions.getZ(index) + positions.getZ(index + 1) + positions.getZ(index + 2)) / 3;
    const point = worldPointToPlan(
      { x: x + normals.getX(index) * 0.04, z: z + normals.getZ(index) * 0.04 },
      floor.coordinates,
    );
    const id = floor.rooms.find((room) => pointInsidePolygon(point, room.polygon))?.id ?? null;
    result[index] = id;
    result[index + 1] = id;
    result[index + 2] = id;
  }
  return result;
}
