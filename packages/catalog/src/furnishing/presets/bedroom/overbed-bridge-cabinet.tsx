import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OVERBED_BRIDGE_CABINET_SIZE = [2, 0.65, 0.4] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function OverbedBridgeCabinet({
  size = OVERBED_BRIDGE_CABINET_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group name="overbed-bridge-cabinet" scale={[size[0] / 2, size[1] / 0.65, size[2] / 0.4]}>
      <RoundedFurniturePanel size={[2, 0.65, 0.36]} position={[0, 0.325, -0.02]} color="#dcd9d1" />
      {[-2 / 3, 0, 2 / 3].map((x, i) => (
        <group key={x}>
          <RoundedFurniturePanel
            name="bridge-door"
            size={[2 / 3 - 0.006, 0.61, 0.025]}
            position={[x, 0.335, 0.1725]}
            color="#e7e4dc"
            radius={0.003}
          />
          <mesh position={[x + (i === 0 ? 0.28 : -0.28), 0.1, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 16]} />
            <ToonMaterial color="#302e2a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
