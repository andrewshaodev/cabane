import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const TOILET_PAPER_HOLDER_SIZE = [0.18, 0.12, 0.14] as const;

/** Wall plate, two brackets, spindle and paper roll. */
export function ToiletPaperHolder({ size = TOILET_PAPER_HOLDER_SIZE }: { size?: SceneItemSize } = {}) {
  return <group name="toilet-paper-holder" scale={[size[0] / 0.18, size[1] / 0.12, size[2] / 0.14]}>
    <RoundedFurniturePanel name="wall-plate" size={[0.18, 0.12, 0.015]} position={[0, 0.06, 0.0075]} color="#606b70" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="bracket" size={[0.02, 0.02, 0.12]} position={[-0.08, 0.06, 0.08]} color="#606b70" radius={0.006} />
    <RoundedFurniturePanel name="bracket" size={[0.02, 0.02, 0.12]} position={[0.08, 0.06, 0.08]} color="#606b70" radius={0.006} />
    <mesh name="paper-roll" position={[0, 0.06, 0.085]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow><cylinderGeometry args={[0.05, 0.05, 0.125, 16]} /><ToonMaterial color="#e8e5dc" /></mesh>
    <mesh name="spindle" position={[0, 0.06, 0.085]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow><cylinderGeometry args={[0.008, 0.008, 0.16, 16]} /><ToonMaterial color="#606b70" /></mesh>
  </group>;
}
