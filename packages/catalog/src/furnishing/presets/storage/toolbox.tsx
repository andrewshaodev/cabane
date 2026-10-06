import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const TOOLBOX_SIZE = [0.45, 0.3, 0.24] as const;

/** Blue tool case with lid seam, two latches and raised carry handle. */
export function Toolbox({ size = TOOLBOX_SIZE }: { size?: SceneItemSize } = {}) {
  return <group name="toolbox" scale={[size[0] / 0.45, size[1] / 0.3, size[2] / 0.24]} userData={{ walkCollider: true }}>
    <RoundedFurniturePanel name="case" size={[0.45, 0.2, 0.24]} position={[0, 0.1, 0]} color="#57758c" radius={0.02} outline={false} />
    <RoundedFurniturePanel name="lid" size={[0.45, 0.032, 0.24]} position={[0, 0.216, 0]} color="#57758c" radius={0.01} />
    <RoundedFurniturePanel name="handle-support" size={[0.025, 0.053, 0.025]} position={[-0.09, 0.2585, 0]} color="#606b70" radius={0.006} />
    <RoundedFurniturePanel name="handle-support" size={[0.025, 0.053, 0.025]} position={[0.09, 0.2585, 0]} color="#606b70" radius={0.006} />
    <RoundedFurniturePanel name="handle" size={[0.205, 0.025, 0.035]} position={[0, 0.2875, 0]} color="#606b70" radius={0.006} />
    <RoundedFurniturePanel name="latch" size={[0.035, 0.055, 0.012]} position={[-0.15, 0.2, 0.123]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="latch" size={[0.035, 0.055, 0.012]} position={[0.15, 0.2, 0.123]} color="#e8e5dc" radius={0.006} />
  </group>;
}
