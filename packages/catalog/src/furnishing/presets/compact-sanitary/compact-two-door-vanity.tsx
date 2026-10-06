import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { IntegratedCompactBasin } from "./integrated-compact-basin";
export const COMPACT_TWO_DOOR_VANITY_SIZE = [0.6, 0.5, 0.35] as const;
/** Two handleless white doors below the integrated bowl; underside is the mounting origin. */
export function CompactTwoDoorVanity({
  size = COMPACT_TWO_DOOR_VANITY_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="compact-two-door-vanity"
      scale={[size[0] / 0.6, size[1] / 0.5, size[2] / 0.35]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="back"
        size={[0.568, 0.44, 0.014]}
        position={[0, 0.238, -0.16]}
        color="#dedfd8"
        radius={0.004}
        outline={false}
      />
      <RoundedFurniturePanel
        name="bottom"
        size={[0.568, 0.018, 0.318]}
        position={[0, 0.009, -0.006]}
        color="#e8e8e2"
        radius={0.004}
        outline={false}
      />
      {[-0.287, 0.287].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="side"
          size={[0.018, 0.477, 0.325]}
          position={[x, 0.2385, -0.0125]}
          color="#e8e8e2"
          radius={0.006}
          outline={false}
        />
      ))}
      {[-0.15, 0.15].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="vanity-door"
          size={[0.296, 0.46, 0.018]}
          position={[x, 0.238, 0.156]}
          color="#eaeae4"
          radius={0.012}
          outline={false}
        />
      ))}
      <IntegratedCompactBasin />
    </group>
  );
}
