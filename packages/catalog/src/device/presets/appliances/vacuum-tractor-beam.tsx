import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ToonMaterial } from "@cabane/engine";
import type { Group } from "three";

export function VacuumTractorBeam({ reducedMotion }: { reducedMotion: boolean }) {
  const dust = useRef<Group>(null);
  const time = useRef(0);
  const waves = useRef<Group>(null);
  useFrame(({ invalidate }, delta) => {
    if (reducedMotion || !dust.current) return;
    time.current += Math.min(delta, 0.05);
    dust.current.children.forEach((particle, index) => {
      const progress = (time.current * 0.32 + index / 24) % 1;
      const angle = index * 2.4 + progress * 5;
      const radius = 0.62 * (1 - progress) + 0.04;
      particle.position.set(Math.cos(angle) * radius, progress * 1.46, Math.sin(angle) * radius);
      particle.rotation.set(progress * 8, angle, 0);
      particle.scale.setScalar(Math.sin(progress * Math.PI));
    });
    waves.current?.children.forEach((wave, index) => {
      const progress = (time.current * 0.24 + index / 5) % 1;
      wave.position.y = 0.04 + progress * 1.41;
      wave.scale.setScalar(1 - progress * 0.82);
    });
    invalidate();
  });
  return (
    <group name="vacuum-tractor-beam">
      <mesh position={[0, 0.75, 0]} raycast={() => undefined}>
        <cylinderGeometry args={[0.12, 0.7, 1.45, 48, 1, true]} />
        <ToonMaterial
          color="#69f5d4"
          emissive="#49dacb"
          emissiveIntensity={0.8}
          transparent
          opacity={0.09}
          depthWrite={false}
          side={2}
        />
      </mesh>
      <group ref={waves}>
        {[0.04, 0.38, 0.75, 1.12, 1.45].map((height) => (
          <mesh
            key={height}
            position={[0, height, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            raycast={() => undefined}
          >
            <torusGeometry args={[0.68, 0.008, 6, 48]} />
            <ToonMaterial
              color="#9affdf"
              emissive="#67e8cf"
              emissiveIntensity={0.8}
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
      <group ref={dust}>
        {Array.from({ length: 24 }, (_, index) => (
          <mesh
            key={index}
            position={[Math.sin(index) * 0.4, index / 17, Math.cos(index) * 0.4]}
            raycast={() => undefined}
          >
            <octahedronGeometry args={[index % 3 === 0 ? 0.025 : 0.013]} />
            <ToonMaterial
              color={index % 3 === 0 ? "#c8a278" : "#b1ffee"}
              emissive="#78c9b1"
              emissiveIntensity={0.35}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
