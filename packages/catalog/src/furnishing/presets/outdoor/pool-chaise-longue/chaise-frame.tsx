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
) => <RoundedFurniturePanel
  key={key}
  name={key}
  size={size}
  position={position}
  rotation={rotation}
  color={teak}
  outlineColor={teakDark}
  radius={.015}
/>;

export function PoolChaiseFrame() {
  return <group name="pool-chaise-teak-frame">
    {[-.36, .36].map((x) => roundedTeak(
      `pool-chaise-side-rail-${x}`,
      [.08, .08, 1.5],
      [x, .17, .3],
    ))}
    {[-.39, .98].map((z) => roundedTeak(
      `pool-chaise-cross-rail-${z}`,
      [.64, .08, .08],
      [0, .17, z],
    ))}
    {[-.36, .36].flatMap((x) => [-.35, .82].map((z) => roundedTeak(
      `pool-chaise-leg-${x}-${z}`,
      [.08, .17, .08],
      [x, .085, z],
    )))}
    {[-.285, .285].map((x) => roundedTeak(
      `pool-chaise-back-support-${x}`,
      [.05, .05, .64],
      [x, CHAISE_BACK_CENTER[1] - .045, CHAISE_BACK_CENTER[2] - .04],
      [CHAISE_BACK_ANGLE_RADIANS, 0, 0],
    ))}
    <mesh name="pool-chaise-back-hinge" position={[0, .27, -.5]}
      rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <cylinderGeometry args={[.06, .06, .72, 16]} />
      <ToonMaterial color={teakDark} />
      <Outlines color="#55402d" thickness={.0015} screenspace={false} />
    </mesh>
  </group>;
}
