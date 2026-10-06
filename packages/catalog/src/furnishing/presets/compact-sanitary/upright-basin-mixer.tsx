import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const UPRIGHT_BASIN_MIXER_SIZE = [0.055, 0.19, 0.1] as const;
/** Straight upright mixer with horizontal spout; static, no water-control slot. */
export function UprightBasinMixer({
  size = UPRIGHT_BASIN_MIXER_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const color = variant === "black" ? "#282c28" : variant === "brass" ? "#c4a568" : "#aab3af";
  return (
    <group name="upright-basin-mixer" scale={[size[0] / 0.055, size[1] / 0.19, size[2] / 0.1]}>
      <mesh name="mixer-base" position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.01, 24]} />
        <ToonMaterial color={color} />
      </mesh>
      <mesh name="mixer-body" position={[0, 0.085, 0]}>
        <cylinderGeometry args={[0.019, 0.019, 0.16, 24]} />
        <ToonMaterial color={color} />
      </mesh>
      <mesh name="mixer-spout" position={[0, 0.137, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.07, 16]} />
        <ToonMaterial color={color} />
      </mesh>
      <RoundedFurniturePanel
        name="mixer-lever"
        size={[0.055, 0.025, 0.025]}
        position={[0, 0.1775, 0]}
        color={color}
        radius={0.008}
        outline={false}
      />
    </group>
  );
}
