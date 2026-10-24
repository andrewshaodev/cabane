import { ToonMaterial, type SceneItemSize } from "@cabane/engine";

export const TABLETOP_CANDLE_SIZE = [0.12, 0.18, 0.12] as const;
export function TabletopCandle({
  size = TABLETOP_CANDLE_SIZE,
  variant = "ivory",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group scale={[size[0] / 0.12, size[1] / 0.18, size[2] / 0.12]}>
      <mesh position={[0, 0.085, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.17, 24]} />
        <ToonMaterial color={variant === "clay" ? "#bc8168" : "#eee1c7"} />
      </mesh>
      <mesh position={[0, 0.175, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.01, 8]} />
        <ToonMaterial color="#514638" />
      </mesh>
    </group>
  );
}
