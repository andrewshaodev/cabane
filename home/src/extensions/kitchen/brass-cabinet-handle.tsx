import { ToonMaterial } from "@cabane/engine";
import {
  KITCHEN_BRASS,
  KitchenBox,
  type KitchenVector3,
} from "./kitchen-finish";

export function BrassCabinetHandle({
  position,
  vertical = false,
}: {
  readonly position: KitchenVector3;
  readonly vertical?: boolean;
}) {
  return (
    <group position={position}>
      <KitchenBox
        size={vertical ? [0.024, 0.2, 0.024] : [0.2, 0.024, 0.024]}
        position={[0, 0, 0]}
        color={KITCHEN_BRASS}
        outline="#6f4d20"
      />
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          castShadow
          position={vertical
            ? [0, side * 0.075, -0.018]
            : [side * 0.075, 0, -0.018]}
        >
          <boxGeometry args={[0.018, 0.018, 0.045]} />
          <ToonMaterial color={KITCHEN_BRASS} />
        </mesh>
      ))}
    </group>
  );
}
