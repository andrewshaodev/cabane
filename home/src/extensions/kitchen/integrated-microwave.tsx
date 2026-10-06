import { ToonMaterial } from "@cabane/engine";
import { KITCHEN_DARK, KitchenBox } from "./kitchen-finish";

export function IntegratedMicrowave() {
  return (
    <group name="micro-ondes-integre-custom">
      <KitchenBox
        size={[0.52, 0.43, 0.035]}
        position={[2.11, 1.8, 0.47]}
        color={KITCHEN_DARK}
        outline="#171817"
      />
      <KitchenBox
        size={[0.39, 0.24, 0.016]}
        position={[2.11, 1.77, 0.496]}
        color="#414846"
        outline="#171817"
      />
      <mesh position={[2.26, 2, 0.498]}>
        <boxGeometry args={[0.13, 0.035, 0.014]} />
        <ToonMaterial color="#6f756f" />
      </mesh>
    </group>
  );
}
