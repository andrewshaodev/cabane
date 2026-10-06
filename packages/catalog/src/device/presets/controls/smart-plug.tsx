import { ActivityHologram } from "../../visuals/activity-hologram";
import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function SmartPlugModel({ visualState, reducedMotion }: HomeDeviceModelProps) {
  return (
    <group name="catalog-smart-plug">
      <RoundedBox
        args={[0.07, 0.07, 0.049]}
        radius={0.012}
        smoothness={2}
        position={[0, 0.035, 0.0245]}
        castShadow
      >
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.0025} />
      </RoundedBox>
      <mesh position={[0, 0.038, 0.052]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.021, 0.021, 0.006, 18]} />
        <ToonMaterial color="#d1d4ce" />
      </mesh>
      {[-0.008, 0.008].map((x) => (
        <mesh key={x} position={[x, 0.04, 0.055]}>
          <boxGeometry args={[0.004, 0.014, 0.001]} />
          <ToonMaterial color="#39413f" />
        </mesh>
      ))}
      <ActivityHologram
        visualState={visualState}
        reducedMotion={reducedMotion}
        position={[0, 0.24, 0.09]}
        scale={0.65}
      />
      <StatusBeacon visualState={visualState} position={[0.022, 0.015, 0.047]} scale={0.22} />
    </group>
  );
}
