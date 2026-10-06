import { KitchenBaseCabinet } from "./kitchen-base-cabinet";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const KITCHEN_HOB_CABINET_SIZE = [0.6, 0.91, 0.63] as const;
export function KitchenHobCabinet({ size = KITCHEN_HOB_CABINET_SIZE, variant = "default" }: { size?: SceneItemSize; variant?: string }) {
  return <group name="kitchen-hob-cabinet" scale={[size[0] / 0.6, size[1] / 0.91, size[2] / 0.63]} userData={{ walkCollider: true }}>
<KitchenBaseCabinet size={[.6, .9, .63]} variant={variant} />
<RoundedFurniturePanel name="hob-glass" size={[.54,.01,.48]} position={[0,.905,0]} color="#252e2d" radius={.008} />
{[-.14,.14].flatMap(x => [-.12,.12].map(z => <mesh key={`${x}-${z}`} position={[x,.91,z]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.068,.073,24]} /><ToonMaterial color="#89928b" /></mesh>))}
  </group>;
}
