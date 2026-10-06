import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

const keypadPositions = Array.from({ length: 12 }, (_, index) => ({
  x: ((index % 3) - 1) * 0.044,
  y: 0.134 - Math.floor(index / 3) * 0.034,
}));

export function AlarmKeypadModel({ visualState }: HomeDeviceModelProps) {
  const armed = visualState === "connected-active";
  return (
    <group name="catalog-alarm-keypad">
      <RoundedBox
        args={[0.18, 0.25, 0.028]}
        radius={0.018}
        smoothness={2}
        position={[0, 0.125, 0.014]}
        castShadow
      >
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.003} />
      </RoundedBox>
      <RoundedBox
        args={[0.13, 0.05, 0.005]}
        radius={0.006}
        smoothness={2}
        position={[0, 0.205, 0.0305]}
      >
        <ToonMaterial
          color="#33423f"
          emissive={armed ? palette.green : "#52635e"}
          emissiveIntensity={armed ? 0.32 : 0.06}
        />
      </RoundedBox>
      {keypadPositions.map(({ x, y }, index) => (
        <mesh key={index} name={`alarm-key-${index + 1}`} position={[x, y, 0.0315]}>
          <boxGeometry args={[0.028, 0.021, 0.007]} />
          <ToonMaterial color={index >= 9 ? "#9daba5" : palette.bodyDark} />
        </mesh>
      ))}
      <StatusBeacon visualState={visualState} position={[0.065, 0.226, 0.031]} scale={0.1} />
    </group>
  );
}
