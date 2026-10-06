import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const MEDIA_SHELF_SURROUND_SIZE = [2, 1.73, 0.36] as const;
/** Generic proportions inferred from reference appearance, not manufacturer measurements. */
export function MediaShelfSurround({
  size = MEDIA_SHELF_SURROUND_SIZE,
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group name="media-shelf-surround" scale={[size[0] / 2, size[1] / 1.73, size[2] / 0.36]}>
      <RoundedFurniturePanel
        size={[1.92, 1.68, 0.02]}
        position={[0, 0.865, -0.155]}
        color="#ccc8bc"
        radius={0.002}
        outline={false}
      />
      {[-0.9825, 0.9825].map((x) => (
        <RoundedFurniturePanel
          key={x}
          size={[0.035, 1.73, 0.36]}
          position={[x, 0.865, 0]}
          color="#eeeee5"
          radius={0.002}
        />
      ))}
      <RoundedFurniturePanel
        size={[1.93, 0.035, 0.36]}
        position={[0, 1.7125, 0]}
        color="#eeeee5"
        radius={0.002}
      />
      {[1.05, 1.52].map((y) => (
        <RoundedFurniturePanel
          name="media-surround-shelf"
          key={y}
          size={[1.93, 0.025, 0.34]}
          position={[0, y, 0]}
          color="#c7a67b"
          radius={0.002}
          outlineColor="#9c7c58"
        />
      ))}
    </group>
  );
}
