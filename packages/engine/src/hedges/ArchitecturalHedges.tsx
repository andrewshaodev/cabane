import { GROUND_ELEVATION_METERS } from "../ground-elevation";
import { memo } from "react";
import { planPointToWorld } from "../geometry";
import type { FloorSpec } from "../types";
import { HedgeModel } from "./HedgeModel";
import { validHedge } from "./hedge-validity";

export const ArchitecturalHedges = memo(function ArchitecturalHedges({
  floor,
}: {
  floor: FloorSpec;
}) {
  return (
    <group name="architectural-hedges">
      {(floor.hedges ?? [])
        .filter((hedge) => validHedge(hedge, floor.coordinates.metersPerPlanUnit))
        .map((hedge) => {
          const [x, z] = planPointToWorld(hedge.from, floor.coordinates);
          const [tx, tz] = planPointToWorld(hedge.to, floor.coordinates);
          return (
            <group
              key={hedge.id}
              name={`hedge-${hedge.id}`}
              position={[(x + tx) / 2, GROUND_ELEVATION_METERS, (z + tz) / 2]}
              rotation={[0, -Math.atan2(tz - z, tx - x), 0]}
            >
              <HedgeModel
                style={hedge.style}
                length={Math.hypot(tx - x, tz - z)}
                height={hedge.heightMeters}
                width={hedge.widthMeters}
              />
            </group>
          );
        })}
    </group>
  );
});
