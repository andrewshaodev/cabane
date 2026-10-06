import { pointInsidePolygon, resolveItemTransform, worldPointToPlan, type FloorSpec, type ItemPlacement } from "@cabane/engine";

type WallPlacement = Extract<ItemPlacement, { kind: "wall" }>;

/** Thin items must reach room finish polygons inset from the physical wall face. */
export function insetWallPlacementIntoRoom(placement: WallPlacement, floor: FloorSpec): WallPlacement {
  const touchesRoom = (candidate: WallPlacement) => {
    const { position } = resolveItemTransform(candidate, floor);
    const at = worldPointToPlan({ x: position[0], z: position[2] }, floor.coordinates);
    return floor.rooms.some((room) => pointInsidePolygon(at, room.polygon));
  };
  if (touchesRoom(placement)) return placement;
  for (let inset = .005; inset <= .05; inset += .005) {
    const candidate = { ...placement, depthOffsetMeters: placement.depthOffsetMeters + inset };
    if (touchesRoom(candidate)) return candidate;
  }
  return placement;
}
