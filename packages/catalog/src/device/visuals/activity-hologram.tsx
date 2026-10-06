import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import type { Group } from "three";

/** Camera-facing activity cue. Depth testing preserves walls and furniture occlusion. */
export function ActivityHologram({
  visualState,
  reducedMotion,
  position,
  scale = 1,
}: Pick<HomeDeviceModelProps, "visualState" | "reducedMotion"> & {
  position: [number, number, number];
  scale?: number;
}) {
  const float = useRef<Group>(null);
  const time = useRef(0);
  const active = visualState === "connected-active";
  useFrame(({ invalidate }, delta) => {
    if (!active || reducedMotion || !float.current) return;
    time.current += Math.min(delta, 0.05);
    float.current.position.y = Math.sin(time.current * 1.8) * 0.025;
    invalidate();
  });
  if (!active) return null;
  return (
    <group name="activity-hologram" position={position} scale={scale}>
      <Billboard>
        <group ref={float} name="activity-hologram-float">
          <mesh raycast={() => undefined}>
            <circleGeometry args={[0.14, 32]} />
            <ToonMaterial
              color="#245958"
              emissive="#245958"
              emissiveIntensity={0.35}
              transparent
              opacity={0.7}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0, 0.002]} raycast={() => undefined}>
            <torusGeometry args={[0.14, 0.006, 5, 32]} />
            <ToonMaterial color="#9debdc" emissive="#67cdb9" emissiveIntensity={0.7} />
          </mesh>
          <mesh
            position={[0, -0.008, 0.008]}
            rotation={[0, 0, Math.PI * 0.72]}
            raycast={() => undefined}
          >
            <torusGeometry args={[0.063, 0.009, 6, 24, Math.PI * 1.56]} />
            <ToonMaterial color="#d5fff0" emissive="#9debdc" emissiveIntensity={0.7} />
          </mesh>
          <mesh position={[0, 0.052, 0.008]} raycast={() => undefined}>
            <capsuleGeometry args={[0.009, 0.065, 3, 6]} />
            <ToonMaterial color="#d5fff0" emissive="#9debdc" emissiveIntensity={0.7} />
          </mesh>
        </group>
      </Billboard>
    </group>
  );
}
