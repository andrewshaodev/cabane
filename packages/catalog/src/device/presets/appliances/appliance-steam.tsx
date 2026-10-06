import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { ToonMaterial } from "@cabane/engine";
import type { Group, Mesh, MeshToonMaterial } from "three";

export function ApplianceSteam({
  reducedMotion,
  position,
}: {
  reducedMotion: boolean;
  position: [number, number, number];
}) {
  const steam = useRef<Group>(null);
  const time = useRef(0);
  useFrame(({ invalidate }, delta) => {
    if (reducedMotion || !steam.current) return;
    time.current += Math.min(delta, 0.05);
    steam.current.children.forEach((child, i) => {
      const p = (time.current * 0.45 + i / 3) % 1;
      child.position.set(Math.sin(p * 5 + i) * 0.025, p * 0.25, 0);
      child.scale.setScalar(0.65 + p * 0.8);
      ((child as Mesh).material as MeshToonMaterial).opacity = Math.sin(p * Math.PI) * 0.55;
    });
    invalidate();
  });
  return (
    <group ref={steam} name="appliance-steam" position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(i % 2) * 0.02, 0.04 + i * 0.07, 0]} raycast={() => undefined}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <ToonMaterial
            color="#d8f3ed"
            emissive="#a4d7cf"
            emissiveIntensity={0.3}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
