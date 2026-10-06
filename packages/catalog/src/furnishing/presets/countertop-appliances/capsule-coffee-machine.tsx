import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const CAPSULE_COFFEE_MACHINE_SIZE = [0.2, 0.3, 0.35] as const;
/** White capsule machine with a dispensing recess and a projecting drip tray. */
export function CapsuleCoffeeMachine({
  size = CAPSULE_COFFEE_MACHINE_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      userData={{ walkCollider: true }}
      name="capsule-coffee-machine"
      scale={[size[0] / 0.2, size[1] / 0.3, size[2] / 0.35]}
    >
      <RoundedFurniturePanel
        name="machine-body"
        size={[0.2, 0.28, 0.235]}
        position={[0, 0.16, -0.0575]}
        color="#e8e8e3"
        radius={0.02}
      />
      <RoundedFurniturePanel
        name="drip-tray"
        size={[0.17, 0.022, 0.35]}
        position={[0, 0.011, 0]}
        color="#909895"
        radius={0.009}
        outline={false}
      />
      <RoundedFurniturePanel
        name="dispensing-recess"
        size={[0.095, 0.195, 0.004]}
        position={[0, 0.1275, 0.062]}
        color="#323a3b"
        radius={0.005}
        outline={false}
      />
      <RoundedFurniturePanel
        name="capsule-lever"
        size={[0.08, 0.008, 0.19]}
        position={[0, 0.286, -0.045]}
        color="#8a918f"
        radius={0.003}
        outline={false}
      />
      <mesh position={[0, 0.203, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.024, 12]} />
        <ToonMaterial color="#767f7e" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.024, 0.09 + i * 0.019]}>
          <boxGeometry args={[0.12, 0.002, 0.003]} />
          <ToonMaterial color="#596364" />
        </mesh>
      ))}
    </group>
  );
}
