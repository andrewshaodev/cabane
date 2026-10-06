import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const VINYL_RECORD_CABINET_SIZE = [0.9, 0.7, 0.4] as const;

/** Walnut cabinet with four open record compartments and a turntable-height top. */
export function VinylRecordCabinet({
  size = VINYL_RECORD_CABINET_SIZE,
}: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="vinyl-record-cabinet"
      scale={[size[0] / 0.9, size[1] / 0.7, size[2] / 0.4]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="foot"
        size={[0.06, 0.12, 0.06]}
        position={[-0.36, 0.06, -0.12]}
        color="#bd9367"
        radius={0.003}
        outline={false}
      />
      <RoundedFurniturePanel
        name="foot"
        size={[0.06, 0.12, 0.06]}
        position={[-0.36, 0.06, 0.12]}
        color="#bd9367"
        radius={0.003}
        outline={false}
      />
      <RoundedFurniturePanel
        name="foot"
        size={[0.06, 0.12, 0.06]}
        position={[0.36, 0.06, -0.12]}
        color="#bd9367"
        radius={0.003}
        outline={false}
      />
      <RoundedFurniturePanel
        name="foot"
        size={[0.06, 0.12, 0.06]}
        position={[0.36, 0.06, 0.12]}
        color="#bd9367"
        radius={0.003}
        outline={false}
      />
      <RoundedFurniturePanel
        name="bottom"
        size={[0.9, 0.03, 0.4]}
        position={[0, 0.135, 0]}
        color="#805c46"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="top"
        size={[0.9, 0.03, 0.4]}
        position={[0, 0.685, 0]}
        color="#956e51"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="side"
        size={[0.03, 0.52, 0.4]}
        position={[-0.435, 0.41, 0]}
        color="#805c46"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="side"
        size={[0.03, 0.52, 0.4]}
        position={[0.435, 0.41, 0]}
        color="#805c46"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="back"
        size={[0.84, 0.52, 0.02]}
        position={[0, 0.41, -0.19]}
        color="#684a39"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="record-divider"
        size={[0.02, 0.52, 0.38]}
        position={[-0.22, 0.41, 0.01]}
        color="#956e51"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="record-divider"
        size={[0.02, 0.52, 0.38]}
        position={[0, 0.41, 0.01]}
        color="#956e51"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="record-divider"
        size={[0.02, 0.52, 0.38]}
        position={[0.22, 0.41, 0.01]}
        color="#956e51"
        radius={0.006}
      />
    </group>
  );
}
