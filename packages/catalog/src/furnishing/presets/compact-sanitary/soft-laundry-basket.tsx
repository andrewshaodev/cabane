import { Vector2 } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const SOFT_LAUNDRY_BASKET_SIZE = [0.38, 0.2745, 0.3] as const;
const profile = [
  [0.19, 0.24],
  [0.181, 0.24],
  [0.135, 0.025],
  [0, 0.02],
  [0, 0],
  [0.145, 0],
  [0.18, 0.15],
  [0.19, 0.24],
].map(([r, y]) => new Vector2(r, y));
export function SoftLaundryBasket({ size = SOFT_LAUNDRY_BASKET_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="soft-laundry-basket"
      scale={[size[0] / 0.38, size[1] / 0.2745, size[2] / 0.3]}
      userData={{ walkCollider: true }}
    >
      <mesh name="linen-basket-body" scale={[1, 1, 0.3 / 0.38]}>
        <latheGeometry args={[profile, 32]} />
        <ToonMaterial color="#e4dfd2" side={2} />
      </mesh>
      {[-0.1445, 0.1445].map((z) => (
        <mesh key={z} name="basket-loop-handle" position={[0, 0.235, z]}>
          <torusGeometry args={[0.035, 0.0045, 8, 24, Math.PI]} />
          <ToonMaterial color="#8f7356" />
        </mesh>
      ))}
    </group>
  );
}
