import { coverPosition, Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";

export function MotorizedCurtainModel({ state, visualState }: HomeDeviceModelProps) {
  const reported = visualState === "disconnected" || visualState === "unavailable"
    ? null
    : coverPosition(state);
  const openness = (reported ?? 35) / 100;
  const panelWidth = 0.94 - openness * 0.7;
  const panelOffset = 0.48 + openness * 0.35;
  return (
    <group name="catalog-motorized-curtain">
      <mesh position={[0, 2.36, 0.1]} castShadow>
        <boxGeometry args={[2, 0.08, 0.12]} />
        <ToonMaterial color="#dedbd3" />
        <Outlines color="#666c68" thickness={0.004} />
      </mesh>
      {[-0.86, 0.86].map((x) => (
        <mesh key={x} position={[x, 2.36, 0.02]}>
          <boxGeometry args={[0.08, 0.08, 0.04]} />
          <ToonMaterial color="#aeb4af" />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * panelOffset, 1.14, 0.125]} castShadow receiveShadow>
          <boxGeometry args={[panelWidth, 2.28, 0.07]} />
          <ToonMaterial color={side < 0 ? "#d8c8ad" : "#dfcfb6"} />
          <Outlines color="#81745f" thickness={0.004} />
        </mesh>
      ))}
      {[-0.6, -0.2, 0.2, 0.6].map((x) => (
        <mesh key={x} position={[x, 1.14, 0.158]}>
          <boxGeometry args={[0.012, 2.22, 0.004]} />
          <ToonMaterial color="#b6a78f" />
        </mesh>
      ))}
      <mesh position={[0.91, 2.29, 0.125]}>
        <boxGeometry args={[0.12, 0.14, 0.07]} />
        <ToonMaterial color="#707873" />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.91, 2.3, 0.153]} scale={0.28} />
    </group>
  );
}
