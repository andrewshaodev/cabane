import { ToonMaterial } from "@cabane/engine";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { AdditiveBlending, Group, Mesh, type MeshToonMaterial } from "three";

/** Brief camera-local energy bloom; it never leaves a stationary trail behind the player. */
export function MuzzleFlash({ shotId }: { shotId: number }) {
  const root = useRef<Group>(null);
  const age = useRef(Infinity);
  useEffect(() => {
    if (shotId > 0) age.current = 0;
  }, [shotId]);
  useFrame((_, delta) => {
    age.current += delta;
    if (!root.current) return;
    const opacity = Math.max(0, 1 - age.current / 0.045);
    root.current.visible = opacity > 0;
    root.current.scale.setScalar(0.7 + (1 - opacity) * 0.7);
    for (const child of root.current.children) {
      if ((child as Mesh).isMesh)
        ((child as Mesh).material as MeshToonMaterial).opacity =
          opacity * (child.userData.glowOpacity ?? 1);
    }
  });
  return (
    <group ref={root} visible={false} name="laser-muzzle-flash">
      <mesh position={[0, 0, -0.035]} scale={[0.03, 0.03, 0.09]}>
        <octahedronGeometry args={[1, 0]} />
        <ToonMaterial
          color="#eeffff"
          emissive="#acffff"
          emissiveIntensity={4}
          toneMapped={false}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh userData={{ glowOpacity: 0.2 }} scale={[0.075, 0.075, 0.075]}>
        <sphereGeometry args={[1, 8, 6]} />
        <ToonMaterial
          color="#45e4ff"
          emissive="#45e4ff"
          emissiveIntensity={2}
          toneMapped={false}
          transparent
          opacity={0.2}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {Array.from({ length: 5 }, (_, index) => {
        const angle = (index * Math.PI * 2) / 5;
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 0.026, Math.sin(angle) * 0.026, -0.009]}
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            <coneGeometry args={[0.008, 0.09, 4]} />
            <ToonMaterial
              color="#fff2cd"
              emissive="#ffe1a0"
              emissiveIntensity={2}
              toneMapped={false}
              transparent
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
