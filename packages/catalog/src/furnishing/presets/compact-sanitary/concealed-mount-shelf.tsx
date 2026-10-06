import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const CONCEALED_MOUNT_SHELF_SIZE = [0.63, 0.03, 0.37] as const;
export function ConcealedMountShelf({
  size = CONCEALED_MOUNT_SHELF_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <RoundedFurniturePanel
      name="concealed-mount-shelf"
      size={[size[0], size[1], size[2]]}
      position={[0, size[1] / 2, size[2] / 2]}
      color={variant === "oak" ? "#c7a67b" : variant === "white" ? "#eae8df" : "#9da7a7"}
      radius={Math.min(0.003, size[1] / 4)}
      outline={false}
    />
  );
}
