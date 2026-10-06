import { useEffect, useMemo } from "react";
import { ToonMaterial } from "@cabane/engine";
import type { ReactNode } from "react";
import { createPergolaGeometry } from "./pergola-geometry";

export const WROUGHT_IRON_PERGOLA_SIZE = [4, 2.7, 3] as const;
export function PergolaFrame({ children, bulbFinish }: { children?: ReactNode; bulbFinish?: { color: string; emissiveIntensity: number } }) {
  const geometry = useMemo(createPergolaGeometry, []);
  useEffect(() => () => {
    Object.values(geometry).flat().forEach(value => value.dispose());
  }, [geometry]);
  return <group name="provencal-wrought-iron-pergola">
    {[-1.88, 1.88].flatMap(x => [-1.38, 1.38].map(z => <group key={`${x}-${z}`} userData={{ walkCollider: true }}>
      <mesh position={[x, 1.31, z]} castShadow><boxGeometry args={[.065, 2.62, .065]} /><ToonMaterial color="#303b36" /></mesh>
      <mesh position={[x, .025, z]} castShadow><boxGeometry args={[.17, .05, .17]} /><ToonMaterial color="#303b36" /></mesh>
    </group>))}
    <mesh geometry={geometry.iron} castShadow><ToonMaterial color="#303b36" /></mesh>
    <mesh geometry={geometry.wood} castShadow><ToonMaterial color="#766044" /></mesh>
    {geometry.leaves.map((leaf, i) => <mesh key={i} geometry={leaf} castShadow><ToonMaterial color={["#61754a", "#82945b", "#425e42"][i]} /></mesh>)}
    <mesh geometry={geometry.flowers} castShadow><ToonMaterial color="#baa3cc" /></mesh>
    {bulbFinish && <group name="pergola-string-lights">
      <mesh geometry={geometry.cable}><ToonMaterial color="#343a31" /></mesh>
      <mesh geometry={geometry.sockets}><ToonMaterial color="#343a31" /></mesh>
      <mesh geometry={geometry.bulbs}><ToonMaterial color={bulbFinish.color} emissive="#ffd28c" emissiveIntensity={bulbFinish.emissiveIntensity} /></mesh>
    </group>}
    {children}
  </group>;
}
