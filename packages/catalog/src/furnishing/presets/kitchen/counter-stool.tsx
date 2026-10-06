import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const COUNTER_STOOL_SIZE = [.48, .92, .50] as const;

/** Oak counter stool with a 65 cm padded seat, low back, and foot rail. */
export function CounterStool({ size = COUNTER_STOOL_SIZE }: { size?: SceneItemSize }) {
  return <group name="counter-stool"
    scale={[size[0] / .48, size[1] / .92, size[2] / .50]}
    userData={{ walkCollider: true }}>
    {[-.19, .19].flatMap((x) => [-.20, .20].map((z) => <mesh
      key={`${x}-${z}`} name="counter-stool-leg" position={[x, .31, z]} castShadow>
      <boxGeometry args={[.045, .62, .045]} /><ToonMaterial color="#b58b5b" />
    </mesh>))}
    {[[-.19, 0, .40, .03], [.19, 0, .40, .03], [0, -.20, .38, .03], [0, .20, .38, .03]].map((rail, i) =>
      i < 2 ? <mesh key={i} name="counter-stool-footrail" position={[rail[0], rail[2], 0]}>
        <boxGeometry args={[.025, .035, .40]} /><ToonMaterial color="#9b754e" />
      </mesh> : <mesh key={i} name="counter-stool-footrail" position={[0, rail[2], rail[1]]}>
        <boxGeometry args={[.38, .035, .025]} /><ToonMaterial color="#9b754e" />
      </mesh>)}
    <RoundedFurniturePanel name="counter-stool-seat" size={[.48, .10, .50]}
      position={[0, .65, 0]} color="#d9cbb4" radius={.045} />
    <RoundedFurniturePanel name="counter-stool-back" size={[.48, .25, .07]}
      position={[0, .795, -.215]} color="#d0ad78" radius={.025} />
  </group>;
}
