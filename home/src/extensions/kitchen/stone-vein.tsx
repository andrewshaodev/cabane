import { CabinetJoint } from "./cabinet-joint";
import { KITCHEN_STONE_VEIN, type KitchenVector3 } from "./kitchen-finish";

export function StoneVein({
  points,
  width,
}: {
  readonly points: readonly KitchenVector3[];
  readonly width: number;
}) {
  return points
    .slice(1)
    .map((point, index) => (
      <CabinetJoint
        key={`${point[0]}-${point[2]}`}
        from={points[index]}
        to={point}
        color={KITCHEN_STONE_VEIN}
        thickness={width}
      />
    ));
}
