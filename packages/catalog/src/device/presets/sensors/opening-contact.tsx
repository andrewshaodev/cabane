import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function OpeningContactModel({ visualState }: HomeDeviceModelProps) {
  const open = visualState === "connected-active";
  return (
    <group name="catalog-opening-contact">
      <mesh position={[-0.042, 0.055, 0.015]} castShadow>
        <boxGeometry args={[0.055, 0.11, 0.03]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.004} />
      </mesh>
      <mesh position={[open ? 0.055 : 0.028, 0.055, 0.012]} castShadow>
        <boxGeometry args={[0.026, 0.082, 0.024]} />
        <ToonMaterial color={open ? palette.coral : palette.bodyDark} />
        <Outlines color={palette.charcoal} thickness={0.003} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[-0.042, 0.092, 0.034]} scale={0.55} />
    </group>
  );
}
