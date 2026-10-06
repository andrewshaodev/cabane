import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { ToonMaterial } from "@cabane/engine";
import type { Group } from "three";

/** A silent, procedural abstract broadcast, contained within the screen rectangle. */
export function TelevisionPicture({
  width,
  height,
  reducedMotion,
}: {
  width: number;
  height: number;
  reducedMotion: boolean;
}) {
  const shapes = useRef<Group>(null);
  const time = useRef(0);
  useFrame(({ invalidate }, delta) => {
    if (reducedMotion || !shapes.current) return;
    time.current += Math.min(delta, 0.05);
    shapes.current.position.x = Math.sin(time.current * 0.35) * 0.035;
    shapes.current.rotation.z = Math.sin(time.current * 0.25) * 0.035;
    invalidate();
  });
  return (
    <group name="television-picture" scale={[width, height, 1]}>
      <mesh raycast={() => undefined}>
        <planeGeometry args={[1, 1]} />
        <ToonMaterial color="#183e50" emissive="#183e50" emissiveIntensity={0.8} />
      </mesh>
      <group ref={shapes} name="television-picture-motion">
        <mesh
          position={[0.21, 0.12, 0.0002]}
          scale={[height / width, 1, 1]}
          raycast={() => undefined}
        >
          <circleGeometry args={[0.23, 48]} />
          <ToonMaterial color="#f1b77e" emissive="#f1b77e" emissiveIntensity={0.65} />
        </mesh>
        <mesh position={[-0.13, -0.12, 0.0004]} rotation={[0, 0, -0.23]} raycast={() => undefined}>
          <planeGeometry args={[0.58, 0.15]} />
          <ToonMaterial color="#63cbbd" emissive="#63cbbd" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-0.19, 0.08, 0.0006]} rotation={[0, 0, -0.23]} raycast={() => undefined}>
          <planeGeometry args={[0.38, 0.045]} />
          <ToonMaterial color="#b8e7da" emissive="#b8e7da" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
}
