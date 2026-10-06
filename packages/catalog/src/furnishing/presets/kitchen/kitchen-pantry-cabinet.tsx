import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { kitchenFinish } from "./kitchen-finish";
export const KITCHEN_PANTRY_CABINET_SIZE = [0.6, 2.1, 0.63] as const;
export function KitchenPantryCabinet({ size = KITCHEN_PANTRY_CABINET_SIZE, variant = "default" }: { size?: SceneItemSize; variant?: string }) {
  return <group name="kitchen-pantry-cabinet" scale={[size[0] / 0.6, size[1] / 2.1, size[2] / 0.63]} userData={{ walkCollider: true }}>
<RoundedFurniturePanel name="pantry-plinth" size={[0.56, 0.1, 0.56]} position={[0, 0.05, 0]} color="#716a60" radius={.006} />
<RoundedFurniturePanel name="pantry-case" size={[0.6, 2, 0.6]} position={[0, 1.1, -0.015]} color={kitchenFinish(variant)} radius={.006} />
<RoundedFurniturePanel name="pantry-door" size={[0.56, 1.25, 0.025]} position={[0, 0.75, 0.285]} color={kitchenFinish(variant)} radius={.006} />
<RoundedFurniturePanel name="pantry-handle" size={[0.025, 0.16, 0.025]} position={[0.21, 0.75, 0.3025]} color="#777d77" radius={.006} />
<RoundedFurniturePanel name="pantry-door" size={[0.56, 0.65, 0.025]} position={[0, 1.75, 0.285]} color={kitchenFinish(variant)} radius={.006} />
<RoundedFurniturePanel name="pantry-handle" size={[0.025, 0.16, 0.025]} position={[0.21, 1.75, 0.3025]} color="#777d77" radius={.006} />

  </group>;
}
