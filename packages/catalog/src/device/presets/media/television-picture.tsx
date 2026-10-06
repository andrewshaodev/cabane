import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { TelevisionComicPatch as Patch } from "./television-comic-patch";
import { TelevisionSuperman } from "./television-superman";

const CLOUD = [
  [-0.15, -0.025],
  [-0.14, 0.015],
  [-0.1, 0.03],
  [-0.075, 0.075],
  [-0.02, 0.085],
  [0.025, 0.055],
  [0.06, 0.06],
  [0.1, 0.025],
  [0.14, 0.015],
  [0.16, -0.025],
] as const;

/** A silent comic-book flight, entirely inside the physical screen. */
export function TelevisionPicture({
  width,
  height,
  reducedMotion,
}: {
  width: number;
  height: number;
  reducedMotion: boolean;
}) {
  const hero = useRef<Group>(null);
  const clouds = useRef<Group>(null);
  const time = useRef(0);
  useFrame(({ invalidate }, delta) => {
    if (reducedMotion || !hero.current || !clouds.current) return;
    time.current += Math.min(delta, 0.05);
    hero.current.position.y = Math.sin(time.current * 1.4) * 0.025;
    hero.current.rotation.z = Math.sin(time.current * 0.7) * 0.025;
    clouds.current.children.forEach((cloud, i) => {
      // Fade at the edges before wrapping, without ever crossing the screen border.
      const phase = (time.current * 0.045 + i * 0.37) % 1;
      cloud.position.x = 0.31 - phase * 0.62;
      cloud.scale.setScalar(Math.min(1, phase * 12, (1 - phase) * 12));
    });
    invalidate();
  });
  return (
    <group name="television-picture" scale={[width, height, 1]}>
      <Patch
        layer={1}
        color="#428fbd"
        points={[
          [-0.5, -0.5],
          [0.5, -0.5],
          [0.5, 0.5],
          [-0.5, 0.5],
        ]}
      />
      <Patch
        layer={2}
        color="#63b6d3"
        points={[
          [-0.5, -0.5],
          [0.5, -0.5],
          [0.5, 0.03],
          [-0.5, -0.25],
        ]}
      />
      <group ref={clouds}>
        {[-0.33, 0.29, 0.36].map((y, i) => (
          <group key={y} position={[(i - 1) * 0.27, y, 0]}>
            <Patch layer={3 + i} color={i === 2 ? "#bce1e6" : "#fff5da"} points={CLOUD} />
          </group>
        ))}
      </group>
      <group ref={hero} name="television-picture-motion">
        <group scale={[height / width, 1, 1]} position={[0.035, -0.025, 0]}>
          <TelevisionSuperman reducedMotion={reducedMotion} />
        </group>
      </group>
    </group>
  );
}
