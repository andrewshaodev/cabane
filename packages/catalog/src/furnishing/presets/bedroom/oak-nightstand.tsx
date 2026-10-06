import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OAK_NIGHTSTAND_SIZE = [.45, .5, .4] as const;

export function OakNightstand({ size = OAK_NIGHTSTAND_SIZE }: { size?: SceneItemSize }) {
  return <group name="oak-nightstand" scale={[size[0] / .45, size[1] / .5, size[2] / .4]}
    userData={{ walkCollider: true }}>
    {[-.178, .178].flatMap((x) => [-.145, .145].map((z) => <mesh
      key={`${x}-${z}`} position={[x, .06, z]} castShadow>
      <boxGeometry args={[.035, .12, .035]} /><ToonMaterial color="#b99262" />
    </mesh>))}
    <RoundedFurniturePanel size={[.45, .025, .4]} position={[0, .4875, 0]} color="#dbbc8d" />
    {[-.2125, .2125].map((x) => <RoundedFurniturePanel key={x}
      size={[.025, .37, .4]} position={[x, .29, 0]} color="#cfad7b" radius={.004} />)}
    <RoundedFurniturePanel size={[.4, .025, .375]} position={[0, .1225, -.0125]} color="#cba674" radius={.004} />
    <RoundedFurniturePanel size={[.4, .34, .018]} position={[0, .305, -.191]} color="#b69262" radius={.003} outline={false} />
    <RoundedFurniturePanel size={[.4, .024, .36]} position={[0, .291, -.012]} color="#c7a16e" radius={.003} />
    <RoundedFurniturePanel name="nightstand-drawer" size={[.394, .163, .022]}
      position={[0, .38, .18]} color="#d6b584" radius={.004} />
    <mesh name="nightstand-finger-pull" position={[0, .432, .193]}>
      <boxGeometry args={[.1, .012, .004]} /><ToonMaterial color="#846748" />
    </mesh>
  </group>;
}
