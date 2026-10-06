import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const SLATTED_ROOM_DIVIDER_SIZE = [1.2, 1.8, 0.4] as const;

/** Freestanding oak screen with twelve vertical slats and two stabilizing feet. */
export function SlattedRoomDivider({
  size = SLATTED_ROOM_DIVIDER_SIZE,
}: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="slatted-room-divider"
      scale={[size[0] / 1.2, size[1] / 1.8, size[2] / 0.4]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="stabilizing-foot"
        size={[0.14, 0.04, 0.4]}
        position={[-0.45, 0.02, 0]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="stabilizing-foot"
        size={[0.14, 0.04, 0.4]}
        position={[0.45, 0.02, 0]}
        color="#bd9367"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="bottom-rail"
        size={[1.2, 0.08, 0.06]}
        position={[0, 0.08, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="top-rail"
        size={[1.2, 0.06, 0.06]}
        position={[0, 1.77, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[-0.55, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[-0.45, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[-0.35, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[-0.25, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[-0.15, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[-0.05, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[0.05, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[0.15, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[0.25, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[0.35, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[0.45, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="vertical-slat"
        size={[0.045, 1.62, 0.045]}
        position={[0.55, 0.93, 0]}
        color="#bd9367"
        radius={0.006}
      />
    </group>
  );
}
