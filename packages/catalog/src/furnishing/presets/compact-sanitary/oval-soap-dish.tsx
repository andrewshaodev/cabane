import { Vector2 } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const OVAL_SOAP_DISH_SIZE = [0.12, 0.025, 0.08] as const;
const profile = [
  [0.06, 0.018],
  [0.056, 0.02],
  [0.052, 0.014],
  [0.038, 0.006],
  [0, 0.006],
  [0, 0],
  [0.045, 0],
  [0.055, 0.009],
  [0.06, 0.018],
].map(([r, y]) => new Vector2(r, y));
export function OvalSoapDish({
  size = OVAL_SOAP_DISH_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const black = variant === "black-beige";
  return (
    <group name="oval-soap-dish" scale={[size[0] / 0.12, size[1] / 0.025, size[2] / 0.08]}>
      <mesh name="soap-dish-bowl" scale={[1, 1, 2 / 3]}>
        <latheGeometry args={[profile, 32]} />
        <ToonMaterial color={black ? "#282c28" : "#ccb994"} side={2} />
      </mesh>
      <RoundedFurniturePanel
        name="soap-bar"
        size={[0.065, 0.019, 0.034]}
        position={[0, 0.0155, 0]}
        color={black ? "#d5c6a6" : "#acc3b5"}
        radius={0.007}
        outline={false}
      />
    </group>
  );
}
