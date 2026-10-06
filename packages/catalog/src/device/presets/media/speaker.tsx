import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function SpeakerModel({ visualState, reducedMotion }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  const soundBands = useRef<Group>(null);
  useFrame(({ clock, invalidate }) => {
    if (!soundBands.current) return;
    const pulse = active && !reducedMotion ? 1 + 0.16 * Math.sin(clock.elapsedTime * 6) : 1;
    soundBands.current.scale.set(pulse, 1, 1);
    if (active && !reducedMotion) invalidate();
  });
  return (
    <group name="catalog-speaker">
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.115, 0.125, 0.36, 18]} />
        <ToonMaterial color={palette.charcoal} />
        <Outlines color="#39433f" thickness={0.006} />
      </mesh>
      <group ref={soundBands} name="speaker-sound-bands" position={[0, 0, 0.124]}>
        {[0.08, 0.14, 0.2, 0.26].map((height) => (
          <mesh key={height} position={[0, height, 0]}>
            <boxGeometry args={[0.125, 0.009, 0.004]} />
            <ToonMaterial color={active ? palette.coral : palette.bodyDark} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.365, 0]}>
        <cylinderGeometry args={[0.08, 0.105, 0.015, 16]} />
        <ToonMaterial color={palette.body} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0, 0.375, 0]} scale={0.85} />
    </group>
  );
}
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
