import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const WHITE_DISPLAY_COLUMN_SIZE = [0.6, 2.4, 0.3] as const;
/** Generic proportions inferred from reference appearance, not manufacturer measurements. */
export function WhiteDisplayColumn({
  size = WHITE_DISPLAY_COLUMN_SIZE,
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group
      name="white-display-column"
      scale={[size[0] / 0.6, size[1] / 2.4, size[2] / 0.3]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        size={[0.55, 2.35, 0.02]}
        position={[0, 1.2, -0.12]}
        color="#d8d6cc"
        radius={0.002}
        outline={false}
      />
      {[-0.2875, 0.2875].map((x) => (
        <RoundedFurniturePanel
          key={x}
          size={[0.025, 2.4, 0.3]}
          position={[x, 1.2, 0]}
          color="#eeeee6"
          radius={0.002}
        />
      ))}
      {[0.0125, 0.6, 1.2, 1.8, 2.3875].map((y) => (
        <RoundedFurniturePanel
          key={y}
          size={[0.55, 0.025, 0.3]}
          position={[0, y, 0]}
          color="#eeeee6"
          radius={0.002}
        />
      ))}
    </group>
  );
}
