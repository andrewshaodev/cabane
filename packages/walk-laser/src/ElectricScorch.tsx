import { ToonMaterial } from "@cabane/engine";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, Group, Mesh, MeshToonMaterial } from "three";

/** A surface-aligned char patch with hot blue fissures cooling before the char fades. */
export function ElectricScorch({ delay, lifetime }: { delay: number; lifetime: number }) {
  const root = useRef<Group>(null);
  const age = useRef(0);
  useFrame((_, delta) => {
    age.current += delta;
    if (!root.current) return;
    const elapsed = age.current - delay;
    root.current.visible = elapsed >= 0 && elapsed < lifetime;
    for (const child of root.current.children) {
      const mesh = child as Mesh;
      const material = mesh.material as MeshToonMaterial;
      material.opacity = child.userData.char
        ? 0.62 * Math.min(1, (lifetime - elapsed) / 1.5)
        : Math.max(0, 1 - elapsed / 1.5) * (0.7 + 0.3 * Math.sin(elapsed * 32));
    }
  });
  return (
    <group ref={root} name="electric-scorch" visible={false}>
      <mesh userData={{ char: true }} scale={[1, 0.83, 1]} raycast={() => undefined}>
        <circleGeometry args={[0.115, 11]} />
        <ToonMaterial
          color="#272b43"
          transparent
          opacity={0.62}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 9;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.055, Math.sin(angle) * 0.055, 0.001]}
            rotation={[0, 0, angle]}
            raycast={() => undefined}
          >
            <planeGeometry args={[0.05 + (i % 3) * 0.016, 0.005]} />
            <ToonMaterial
              color="#b6eeff"
              emissive="#188fff"
              emissiveIntensity={4}
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
