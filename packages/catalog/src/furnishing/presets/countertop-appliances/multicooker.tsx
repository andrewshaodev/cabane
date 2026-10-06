import { Vector2 } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const MULTICOOKER_SIZE = [0.38, 0.34, 0.325] as const;
const lid = [
  [0.15, 0.278],
  [0.15, 0.287],
  [0.13, 0.3],
  [0.08, 0.315],
  [0, 0.315],
].map(([r, y]) => new Vector2(r, y));
/** Closed countertop pressure cooker; a static visual, with no connected capability. */
export function Multicooker({ size = MULTICOOKER_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      userData={{ walkCollider: true }}
      name="multicooker"
      scale={[size[0] / 0.38, size[1] / 0.34, size[2] / 0.325]}
    >
      <group position={[0, 0, -0.0125]}>
        <mesh position={[0, 0.15, 0]} scale={[1.1, 1, 1]} castShadow>
          <cylinderGeometry args={[0.15, 0.13, 0.265, 32]} />
          <ToonMaterial color="#eeede8" />
        </mesh>
        {[-0.095, 0.095].map((x) => (
          <mesh key={x} position={[x, 0.01, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.02, 12]} />
            <ToonMaterial color="#323638" />
          </mesh>
        ))}
        <mesh castShadow>
          <latheGeometry args={[lid, 32]} />
          <ToonMaterial color="#e8e8e1" />
        </mesh>
        {[-0.175, 0.175].map((x) => (
          <mesh key={x} position={[x, 0.255, 0]} scale={[0.015, 0.018, 0.075]}>
            <sphereGeometry args={[1, 16, 8]} />
            <ToonMaterial color="#323638" />
          </mesh>
        ))}
        <RoundedFurniturePanel
          name="lid-grip"
          size={[0.1, 0.025, 0.065]}
          position={[0, 0.3275, 0]}
          color="#545a5b"
          radius={0.012}
          outline={false}
        />
        <RoundedFurniturePanel
          name="control-face"
          size={[0.085, 0.105, 0.02]}
          position={[0, 0.16, 0.159]}
          color="#303536"
          radius={0.02}
          outline={false}
        />
        <RoundedFurniturePanel
          size={[0.052, 0.027, 0.003]}
          position={[0, 0.18, 0.172]}
          color="#171e21"
          radius={0.003}
          outline={false}
        />
        <mesh position={[0, 0.135, 0.172]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.006, 20]} />
          <ToonMaterial color="#bbbdb8" />
        </mesh>
      </group>
    </group>
  );
}
