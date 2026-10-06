import { KitchenBaseCabinet } from "./kitchen-base-cabinet";
import { type SceneItemSize } from "@cabane/engine";
import { InductionCooktop } from "./induction-cooktop";
export const KITCHEN_HOB_CABINET_SIZE = [0.6, 0.91, 0.63] as const;
export function KitchenHobCabinet({
  size = KITCHEN_HOB_CABINET_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group
      name="kitchen-hob-cabinet"
      scale={[size[0] / 0.6, size[1] / 0.91, size[2] / 0.63]}
      userData={{ walkCollider: true }}
    >
      <KitchenBaseCabinet size={[0.6, 0.9, 0.63]} variant={variant} />
      <group position={[0, 0.9, 0]}>
        <InductionCooktop />
      </group>
    </group>
  );
}
