import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function WallSwitchModel({ visualState }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return (
    <group name="catalog-wall-switch">
      <mesh position={[0, 0.075, 0.012]} castShadow>
        <boxGeometry args={[0.115, 0.15, 0.024]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.005} />
      </mesh>
      <mesh
        position={[0, 0.077, 0.03]}
        rotation={[active ? -0.09 : 0.09, 0, 0]}
      >
        <boxGeometry args={[0.064, 0.08, 0.018]} />
        <ToonMaterial color={active ? palette.coral : palette.bodyDark} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.038, 0.126, 0.039]} scale={0.65} />
    </group>
  );
}
