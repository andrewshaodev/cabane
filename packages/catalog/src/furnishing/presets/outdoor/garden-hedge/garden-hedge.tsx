import { ToonMaterial, type SceneModelProps } from "@cabane/engine";
import { GardenHedgeFoliage } from "./hedge-foliage";

export const GARDEN_HEDGE_SIZE = [2, 1.4, .6] as const;

export function GardenHedge({
  size = GARDEN_HEDGE_SIZE,
}: Partial<Pick<SceneModelProps, "size">>) {
  return <group name="garden-hedge" userData={{ walkCollider: true }} scale={[
    size[0] / GARDEN_HEDGE_SIZE[0],
    size[1] / GARDEN_HEDGE_SIZE[1],
    size[2] / GARDEN_HEDGE_SIZE[2],
  ]}>
    {[-.66, -.22, .22, .66].map((x) => <mesh key={x} name="garden-hedge-trunk"
      position={[x, .12, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[.035, .05, .24, 8]} />
      <ToonMaterial color="#70563b" />
    </mesh>)}
    <GardenHedgeFoliage />
  </group>;
}
