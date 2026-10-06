import { Outlines, ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../construction";
import { CHAISE_BACK_ANGLE_RADIANS, CHAISE_BACK_CENTER } from "./chaise-upholstery";

const teak = "#a87745";
const teakDark = "#6d4a2c";

const roundedTeak = (
  key: string,
  size: [number, number, number],
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
) => (
  <RoundedFurniturePanel
    key={key}
    name={key}
    size={size}
    position={position}
    rotation={rotation}
    color={teak}
    outlineColor={teakDark}
    radius={0.015}
  />
);

export function PoolChaiseFrame() {
  return (
    <group name="pool-chaise-teak-frame">
      {[-0.36, 0.36].map((x) =>
        roundedTeak(`pool-chaise-side-rail-${x}`, [0.08, 0.08, 1.5], [x, 0.17, 0.3]),
      )}
      {[-0.39, 0.98].map((z) =>
        roundedTeak(`pool-chaise-cross-rail-${z}`, [0.64, 0.08, 0.08], [0, 0.17, z]),
      )}
      {[-0.36, 0.36].flatMap((x) =>
        [-0.35, 0.82].map((z) =>
          roundedTeak(`pool-chaise-leg-${x}-${z}`, [0.08, 0.17, 0.08], [x, 0.085, z]),
        ),
      )}
      {[-0.285, 0.285].map((x) =>
        roundedTeak(
          `pool-chaise-back-support-${x}`,
          [0.05, 0.05, 0.64],
          [x, CHAISE_BACK_CENTER[1] - 0.045, CHAISE_BACK_CENTER[2] - 0.04],
          [CHAISE_BACK_ANGLE_RADIANS, 0, 0],
        ),
      )}
      <mesh
        name="pool-chaise-back-hinge"
        position={[0, 0.27, -0.5]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.06, 0.06, 0.72, 16]} />
        <ToonMaterial color={teakDark} />
        <Outlines color="#55402d" thickness={0.0015} screenspace={false} />
      </mesh>
    </group>
  );
}
