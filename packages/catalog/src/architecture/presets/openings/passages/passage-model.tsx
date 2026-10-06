import { useMemo } from "react";
import { openingWorldPlacement } from "@cabane/engine";
import { ToonMaterial } from "@cabane/engine";
import type { PassageSpec } from "@cabane/engine";
import { buildArchedPassageSpandrelShape } from "./arched-passage-spandrel";
import type { OpeningModelProps } from "../opening-model-props";

export function PassageModel({ wall, opening, floor }: OpeningModelProps<PassageSpec>) {
  const placement = openingWorldPlacement(wall, opening, floor.coordinates);
  const arch = useMemo(() => {
    if (opening.variant !== "arched") return null;
    return buildArchedPassageSpandrelShape(opening, placement.widthMeters);
  }, [
    opening.openingHeightMeters,
    opening.variant,
    opening.variant === "arched" ? opening.archRiseMeters : 0,
    placement.widthMeters,
  ]);

  return (
    <group
      name={`opening-model-${opening.variant}`}
      position={[placement.start[0], opening.sillHeightMeters, placement.start[1]]}
      rotation={[0, placement.rotationY, 0]}
    >
      {arch && (
        <mesh position={[0, 0, -wall.thicknessMeters / 2]} castShadow>
          <extrudeGeometry args={[arch, { depth: wall.thicknessMeters, bevelEnabled: false }]} />
          <ToonMaterial color="#e4e0d8" />
        </mesh>
      )}
    </group>
  );
}
