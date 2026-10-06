import { DenseWhiteTowelRail } from "./dense-white-towel-rail";
import { HeatExchangerBars } from "./heat-exchanger-bars";
import { ActivityHologram } from "../../visuals/activity-hologram";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function HeatedTowelRailModel({
  visualState,
  reducedMotion,
  variant,
}: HomeDeviceModelProps) {
  if (variant === "dense-white" || variant === "dense-black")
    return <DenseWhiteTowelRail visualState={visualState} variant={variant} />;
  return (
    <group name="catalog-heated-towel-rail">
      {[-0.24, 0.24].map((x) => (
        <mesh key={`bracket-${x}`} position={[x, 0.6, 0.01]}>
          <boxGeometry args={[0.06, 0.9, 0.02]} />
          <ToonMaterial color="#aeb4af" />
        </mesh>
      ))}
      {[-0.285, 0.285].map((x) => (
        <mesh key={x} position={[x, 0.59, 0.055]} castShadow>
          <boxGeometry args={[0.03, 1.18, 0.05]} />
          <ToonMaterial color="#e8e7e2" />
          <Outlines color="#747b79" thickness={0.004} />
        </mesh>
      ))}
      <HeatExchangerBars horizontal={true} />
      <mesh position={[0, 1.18, 0.055]} castShadow>
        <boxGeometry args={[0.6, 0.04, 0.05]} />
        <ToonMaterial color="#e8e7e2" />
      </mesh>
      <mesh position={[0.235, 0.09, 0.095]} castShadow>
        <boxGeometry args={[0.095, 0.14, 0.05]} />
        <ToonMaterial color={palette.charcoal} />
        <Outlines color="#303836" thickness={0.003} />
      </mesh>
      <ActivityHologram
        visualState={visualState}
        reducedMotion={reducedMotion}
        position={[0, 1.4, 0.15]}
        scale={1}
      />
      <StatusBeacon visualState={visualState} position={[0.235, 0.105, 0.095]} scale={0.55} />
    </group>
  );
}
