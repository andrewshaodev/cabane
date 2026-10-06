import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { CompactFanHead } from "./compact-fan-head";
export const COMPACT_COUNTER_FAN_SIZE = [0.28, 0.3, 0.16] as const;
/** Small black fan supported by a U-frame, with no assumed smart control. */
export function CompactCounterFan({ size = COMPACT_COUNTER_FAN_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      userData={{ walkCollider: true }}
      name="compact-counter-fan"
      scale={[size[0] / 0.28, size[1] / 0.3, size[2] / 0.16]}
    >
      <RoundedFurniturePanel
        name="fan-frame-base"
        size={[0.28, 0.014, 0.16]}
        position={[0, 0.007, 0]}
        color="#303536"
        radius={0.006}
        outline={false}
      />
      {[-0.13, 0.13].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="fan-frame-upright"
          size={[0.018, 0.183, 0.075]}
          position={[x, 0.1055, 0]}
          color="#303536"
          radius={0.008}
          outline={false}
        />
      ))}
      <CompactFanHead />
    </group>
  );
}
