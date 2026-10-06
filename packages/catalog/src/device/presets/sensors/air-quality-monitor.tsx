import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function AirQualityMonitorModel({ state, visualState }: HomeDeviceModelProps) {
  const numeric = Number(state?.state);
  const warning = Number.isFinite(numeric) && numeric > 1_000;
  return (
    <group name="catalog-air-quality-monitor" userData={{ walkCollider: true }}>
      <RoundedBox
        args={[0.1, 0.16, 0.056]}
        radius={0.014}
        smoothness={2}
        position={[0, 0.08, -0.002]}
        castShadow
      >
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.0025} />
      </RoundedBox>
      <mesh position={[0, 0.105, 0.029]}>
        <boxGeometry args={[0.072, 0.052, 0.002]} />
        <ToonMaterial
          color="#31413f"
          emissive={warning ? palette.coral : palette.green}
          emissiveIntensity={0.24}
        />
      </mesh>
      {[-0.026, -0.013, 0, 0.013, 0.026].map((x) => (
        <mesh key={x} position={[x, 0.045, 0.029]}>
          <boxGeometry args={[0.006, 0.034, 0.002]} />
          <ToonMaterial color="#8d9691" />
        </mesh>
      ))}
      <StatusBeacon visualState={visualState} position={[0.035, 0.138, 0.023]} scale={0.16} />
    </group>
  );
}
