import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { ToonMaterial } from "@cabane/engine";

/** Procedural ballistic droplets; no assets or per-frame geometry allocations. */
export function SprinklerSpray({ reducedMotion }: { reducedMotion: boolean }) {
  const spray = useRef<Group>(null);
  const elapsed = useRef(0);
  useFrame(({ invalidate }, delta) => {
    if (reducedMotion || !spray.current) return;
    elapsed.current += Math.min(delta, 0.05);
    spray.current.children.forEach((drop, index) => {
      const t = ((index % 8) / 8 + elapsed.current * 0.8) % 1;
      const angle = (Math.floor(index / 8) * Math.PI) / 4 + elapsed.current * 0.25;
      const radius = 0.025 + t * 1.15;
      drop.position.set(
        Math.cos(angle) * radius,
        0.055 + 0.9 * t - 1.08 * t * t,
        Math.sin(angle) * radius,
      );
    });
    invalidate();
  });
  return (
    <group ref={spray} name="sprinkler-water" userData={{ decorative: true }}>
      {Array.from({ length: 64 }, (_, index) => {
        const t = (index % 8) / 8;
        const angle = (Math.floor(index / 8) * Math.PI) / 4;
        const radius = 0.025 + t * 1.15;
        return (
          <mesh
            key={index}
            position={[
              Math.cos(angle) * radius,
              0.055 + 0.9 * t - 1.08 * t * t,
              Math.sin(angle) * radius,
            ]}
            raycast={() => {}}
          >
            <sphereGeometry args={[0.012, 6, 4]} />
            <ToonMaterial color="#79cfee" transparent opacity={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}
