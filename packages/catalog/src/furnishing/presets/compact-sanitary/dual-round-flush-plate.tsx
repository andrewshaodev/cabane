import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const DUAL_ROUND_FLUSH_PLATE_SIZE = [0.246, 0.164, 0.014] as const;
export function DualRoundFlushPlate({
  size = DUAL_ROUND_FLUSH_PLATE_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const black = variant === "black";
  return (
    <group
      name="dual-round-flush-plate"
      scale={[size[0] / 0.246, size[1] / 0.164, size[2] / 0.014]}
    >
      <RoundedFurniturePanel
        name="flush-plate"
        size={[0.246, 0.164, 0.01]}
        position={[0, 0.082, 0.005]}
        color={black ? "#282c28" : "#e8e7df"}
        radius={0.004}
        outline={false}
      />
      {[
        [-0.035, 0.09, 0.052],
        [0.055, 0.059, 0.04],
      ].map(([x, y, r]) => (
        <group key={x}>
          <mesh
            name="round-flush-button"
            position={[x, y, black ? 0.0105 : 0.012]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[r, r, black ? 0.003 : 0.004, 32]} />
            <ToonMaterial color={black ? "#252925" : "#f5f4ec"} />
          </mesh>
          {black && (
            <mesh name="flush-button-metal-ring" position={[x, y, 0.013]}>
              <torusGeometry args={[r - 0.001, 0.001, 4, 32]} />
              <ToonMaterial color="#b4b6ae" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
