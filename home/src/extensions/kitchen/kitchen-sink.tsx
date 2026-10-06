import { ToonMaterial } from "@cabane/engine";
import { KITCHEN_BRASS, KitchenBox } from "./kitchen-finish";

export function KitchenSink() {
  return (
    <group name="evier-et-robinet-custom">
      <KitchenBox
        size={[0.54, 0.022, 0.38]}
        position={[2.55, 0.934, 0.34]}
        color="#aeb6b1"
        outline="#66706c"
      />
      <KitchenBox
        size={[0.43, 0.018, 0.29]}
        position={[2.55, 0.947, 0.34]}
        color="#77817d"
        outline="#5a625f"
      />
      <mesh position={[2.35, 1.07, 0.19]} castShadow>
        <cylinderGeometry args={[0.022, 0.026, 0.28, 12]} />
        <ToonMaterial color={KITCHEN_BRASS} />
      </mesh>
      <mesh position={[2.45, 1.2, 0.19]} castShadow>
        <torusGeometry args={[0.1, 0.022, 8, 18, Math.PI]} />
        <ToonMaterial color={KITCHEN_BRASS} />
      </mesh>
      <mesh position={[2.55, 1.12, 0.19]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.14, 10]} />
        <ToonMaterial color={KITCHEN_BRASS} />
      </mesh>
    </group>
  );
}
