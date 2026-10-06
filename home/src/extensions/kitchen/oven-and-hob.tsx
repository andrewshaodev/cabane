import { ToonMaterial } from "@cabane/engine";
import { KITCHEN_DARK, KitchenBox } from "./kitchen-finish";

export function OvenAndHob() {
  return (
    <group name="four-et-plaque-induction-custom">
      <KitchenBox
        size={[0.5, 0.57, 0.035]}
        position={[1.09, 0.37, 0.612]}
        color={KITCHEN_DARK}
        outline="#171817"
      />
      <KitchenBox
        size={[0.43, 0.32, 0.018]}
        position={[1.09, 0.29, 0.638]}
        color="#3d4543"
        outline="#171817"
      />
      <KitchenBox
        size={[0.42, 0.035, 0.035]}
        position={[1.09, 0.57, 0.655]}
        color="#8e8b83"
        outline="#474640"
      />
      {[0.93, 1.25].map((x) => (
        <mesh key={x} position={[x, 0.68, 0.645]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.025, 12]} />
          <ToonMaterial color="#a5a098" />
        </mesh>
      ))}
      <KitchenBox
        size={[0.5, 0.025, 0.42]}
        position={[1.09, 0.93, 0.34]}
        color="#252827"
        outline="#111312"
      />
      {[0.96, 1.22].flatMap((x) =>
        [0.23, 0.45].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.95, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.062, 0.078, 24]} />
            <ToonMaterial color="#454a48" />
          </mesh>
        )),
      )}
    </group>
  );
}
