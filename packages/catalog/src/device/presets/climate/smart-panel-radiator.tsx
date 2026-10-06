import { HeatExchangerBars } from "./heat-exchanger-bars";
import { ActivityHologram } from "../../visuals/activity-hologram";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function SmartPanelRadiatorModel({ visualState, reducedMotion }: HomeDeviceModelProps) {
  return (
    <group name="catalog-smart-panel-radiator">
      <mesh position={[0, 0.28, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.976, 0.56, 0.1]} />
        <ToonMaterial color="#eeeae2" />
        <Outlines color="#7f817c" thickness={0.005} />
      </mesh>
      <HeatExchangerBars horizontal={false} />
      <mesh position={[0, 0.58, 0.055]}>
        <boxGeometry args={[1, 0.04, 0.11]} />
        <ToonMaterial color="#c9ccc7" />
      </mesh>
      <mesh position={[0.44, 0.095, 0.105]}>
        <boxGeometry args={[0.1, 0.15, 0.03]} />
        <ToonMaterial color={palette.charcoal} />
      </mesh>
      <ActivityHologram
        visualState={visualState}
        reducedMotion={reducedMotion}
        position={[0, 0.8, 0.16]}
        scale={1}
      />
      <StatusBeacon visualState={visualState} position={[0.44, 0.11, 0.106]} scale={0.45} />
    </group>
  );
}
