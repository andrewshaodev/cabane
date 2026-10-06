import { openingWorldPlacement } from "../geometry";
import { GROUND_ELEVATION_METERS } from "../ground-elevation";
import { ToonMaterial } from "../rendering";
import type { FloorSpec, OpeningSpec, WallSpec } from "../types";

/** Support floor-level exterior openings across the drop to outdoor terrain. */
export function OpeningThreshold({
  wall,
  opening,
  floor,
}: {
  wall: WallSpec;
  opening: OpeningSpec;
  floor: FloorSpec;
}) {
  if (
    wall.classification !== "exterior" ||
    opening.kind === "window" ||
    opening.sillHeightMeters !== 0
  )
    return null;
  const placement = openingWorldPlacement(wall, opening, floor.coordinates);
  return (
    <mesh
      name={`opening-threshold-${opening.id}`}
      position={[placement.center[0], GROUND_ELEVATION_METERS / 2, placement.center[1]]}
      rotation={[0, placement.rotationY, 0]}
      receiveShadow
      castShadow
    >
      <boxGeometry args={[placement.widthMeters, -GROUND_ELEVATION_METERS, wall.thicknessMeters]} />
      <ToonMaterial color="#d7d1c5" />
    </mesh>
  );
}
