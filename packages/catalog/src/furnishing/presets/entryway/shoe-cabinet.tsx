import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const SHOE_CABINET_SIZE = [0.8, 1.1, 0.3] as const;

/** Slim oak cabinet with three cream tilt fronts and recessed pulls. */
export function ShoeCabinet({ size = SHOE_CABINET_SIZE }: { size?: SceneItemSize } = {}) {
  return <group name="shoe-cabinet" scale={[size[0] / 0.8, size[1] / 1.1, size[2] / 0.3]} userData={{ walkCollider: true }}>
    <RoundedFurniturePanel name="bottom" size={[0.8, 0.025, 0.3]} position={[0, 0.0125, 0]} color="#bd9367" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="top" size={[0.8, 0.025, 0.3]} position={[0, 1.0875000000000001, 0]} color="#bd9367" radius={0.006} />
    <RoundedFurniturePanel name="side" size={[0.025, 1.05, 0.3]} position={[-0.3875, 0.55, 0]} color="#bd9367" radius={0.006} />
    <RoundedFurniturePanel name="side" size={[0.025, 1.05, 0.3]} position={[0.3875, 0.55, 0]} color="#bd9367" radius={0.006} />
    <RoundedFurniturePanel name="back" size={[0.75, 1.05, 0.02]} position={[0, 0.55, -0.13999999999999999]} color="#bd9367" radius={0.006} />
    <RoundedFurniturePanel name="tilt-front" size={[0.744, 0.325, 0.02]} position={[0, 0.205, 0.14]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="recessed-pull" size={[0.2, 0.015, 0.002]} position={[0, 0.32499999999999996, 0.153]} color="#606b70" radius={0.006} />
    <RoundedFurniturePanel name="tilt-front" size={[0.744, 0.325, 0.02]} position={[0, 0.55, 0.14]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="recessed-pull" size={[0.2, 0.015, 0.002]} position={[0, 0.67, 0.153]} color="#606b70" radius={0.006} />
    <RoundedFurniturePanel name="tilt-front" size={[0.744, 0.325, 0.02]} position={[0, 0.895, 0.14]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="recessed-pull" size={[0.2, 0.015, 0.002]} position={[0, 1.0150000000000001, 0.153]} color="#606b70" radius={0.006} />
  </group>;
}
