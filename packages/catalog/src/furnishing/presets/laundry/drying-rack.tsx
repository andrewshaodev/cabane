import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const DRYING_RACK_SIZE = [1.2, 0.95, 0.6] as const;

/** White steel standing frame with ten drying rails. */
export function DryingRack({ size = DRYING_RACK_SIZE }: { size?: SceneItemSize } = {}) {
  return <group name="drying-rack" scale={[size[0] / 1.2, size[1] / 0.95, size[2] / 0.6]} userData={{ walkCollider: true }}>
    <RoundedFurniturePanel name="leg" size={[0.035, 0.915, 0.035]} position={[-0.48, 0.4575, -0.25]} color="#606b70" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="leg" size={[0.035, 0.915, 0.035]} position={[-0.48, 0.4575, 0.25]} color="#606b70" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="leg" size={[0.035, 0.915, 0.035]} position={[0.48, 0.4575, -0.25]} color="#606b70" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="leg" size={[0.035, 0.915, 0.035]} position={[0.48, 0.4575, 0.25]} color="#606b70" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="top-side" size={[0.02, 0.035, 0.6]} position={[-0.59, 0.9325, 0]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="top-side" size={[0.02, 0.035, 0.6]} position={[0.59, 0.9325, 0]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="top-end" size={[1.16, 0.035, 0.02]} position={[0, 0.9325, -0.29]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="top-end" size={[1.16, 0.035, 0.02]} position={[0, 0.9325, 0.29]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="drying-rail" size={[0.012, 0.012, 0.56]} position={[-0.51, 0.93, 0]} color="#e8e5dc" radius={0.004} />
    <RoundedFurniturePanel name="drying-rail" size={[0.012, 0.012, 0.56]} position={[-0.396667, 0.93, 0]} color="#e8e5dc" radius={0.004} />
    <RoundedFurniturePanel name="drying-rail" size={[0.012, 0.012, 0.56]} position={[-0.283334, 0.93, 0]} color="#e8e5dc" radius={0.004} />
    <RoundedFurniturePanel name="drying-rail" size={[0.012, 0.012, 0.56]} position={[-0.170001, 0.93, 0]} color="#e8e5dc" radius={0.004} />
    <RoundedFurniturePanel name="drying-rail" size={[0.012, 0.012, 0.56]} position={[-0.056667999999999996, 0.93, 0]} color="#e8e5dc" radius={0.004} />
    <RoundedFurniturePanel name="drying-rail" size={[0.012, 0.012, 0.56]} position={[0.056664999999999965, 0.93, 0]} color="#e8e5dc" radius={0.004} />
    <RoundedFurniturePanel name="drying-rail" size={[0.012, 0.012, 0.56]} position={[0.16999799999999998, 0.93, 0]} color="#e8e5dc" radius={0.004} />
    <RoundedFurniturePanel name="drying-rail" size={[0.012, 0.012, 0.56]} position={[0.283331, 0.93, 0]} color="#e8e5dc" radius={0.004} />
    <RoundedFurniturePanel name="drying-rail" size={[0.012, 0.012, 0.56]} position={[0.396664, 0.93, 0]} color="#e8e5dc" radius={0.004} />
    <RoundedFurniturePanel name="drying-rail" size={[0.012, 0.012, 0.56]} position={[0.509997, 0.93, 0]} color="#e8e5dc" radius={0.004} />
    {[-0.25, 0.25].map((z) => <RoundedFurniturePanel key={z} name="trestle-support" size={[1.18, 0.035, 0.025]} position={[0, 0.8975, z]} color="#e8e5dc" />)}
  </group>;
}
