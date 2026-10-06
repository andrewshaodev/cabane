import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const MEDICINE_CABINET_SIZE = [0.5, 0.65, 0.16] as const;

/** Wall-mounted cream cabinet with framed pale-blue mirror and side pull. */
export function MedicineCabinet({ size = MEDICINE_CABINET_SIZE }: { size?: SceneItemSize } = {}) {
  return <group name="medicine-cabinet" scale={[size[0] / 0.5, size[1] / 0.65, size[2] / 0.16]}>
    <RoundedFurniturePanel name="bottom" size={[0.5, 0.025, 0.15]} position={[0, 0.0125, 0.075]} color="#e8e5dc" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="top" size={[0.5, 0.025, 0.15]} position={[0, 0.6375000000000001, 0.075]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="side" size={[0.025, 0.6, 0.15]} position={[-0.2375, 0.325, 0.075]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="side" size={[0.025, 0.6, 0.15]} position={[0.2375, 0.325, 0.075]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="back" size={[0.45, 0.6, 0.02]} position={[0, 0.325, 0.009999999999999995]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="door" size={[0.45, 0.6, 0.015]} position={[0, 0.325, 0.1475]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="mirror" size={[0.39, 0.54, 0.004]} position={[0, 0.325, 0.157]} color="#b4cbd0" radius={0.003} />
    <RoundedFurniturePanel name="pull" size={[0.016, 0.12, 0.008]} position={[0.216, 0.325, 0.156]} color="#606b70" radius={0.006} />
  </group>;
}
