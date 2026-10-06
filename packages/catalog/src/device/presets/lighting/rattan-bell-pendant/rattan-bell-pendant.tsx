import { useEffect, useMemo } from "react";
import { Outlines, ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { createWovenBellGeometry } from "./woven-bell-geometry";

export const RATTAN_BELL_PENDANT_SIZE = [0.5, 1.2, 0.5] as const;
const CANE_COLORS = ["#bc9461", "#cba574", "#c29c69"] as const;

export function RattanBellPendant({
  size = RATTAN_BELL_PENDANT_SIZE,
  brightness = 0,
}: {
  size?: SceneItemSize;
  brightness?: number;
}) {
  const weave = useMemo(createWovenBellGeometry, []);
  useEffect(() => () => weave.forEach((geometry) => geometry.dispose()), [weave]);
  return (
    <group name="rattan-bell-pendant" scale={[size[0] / 0.5, size[1] / 1.2, size[2] / 0.5]}>
      {weave.map((geometry, index) => (
        <mesh key={index} name="open-rattan-weave" geometry={geometry} castShadow receiveShadow>
          <ToonMaterial color={CANE_COLORS[index]} />
        </mesh>
      ))}
      <mesh name="white-ceiling-rose" position={[0, 1.185, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.04, 0.03, 32]} />
        <ToonMaterial color="#eeeae2" />
        <Outlines color="#bab3a8" thickness={0.001} screenspace={false} />
      </mesh>
      <mesh name="white-pendant-cord" position={[0, 0.8125, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.725, 8]} />
        <ToonMaterial color="#e5e0d6" />
      </mesh>
      <mesh name="bulb-socket" position={[0, 0.419, 0]}>
        <cylinderGeometry args={[0.018, 0.021, 0.07, 16]} />
        <ToonMaterial color="#e5e0d6" />
      </mesh>
      <mesh name="opal-bulb" position={[0, 0.355, 0]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[0.034, 20, 12]} />
        <ToonMaterial color="#f4ead4" emissive="#ffe1a3" emissiveIntensity={brightness} />
      </mesh>
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          name="shade-support-spoke"
          position={[0, 0.455, 0]}
          rotation={[0, (index * Math.PI * 2) / 3, 0]}
        >
          <boxGeometry args={[0.074, 0.003, 0.003]} />
          <ToonMaterial color="#c7b899" />
        </mesh>
      ))}
    </group>
  );
}
