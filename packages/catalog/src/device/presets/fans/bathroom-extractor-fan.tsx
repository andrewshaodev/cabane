import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function BathroomExtractorFanModel({ visualState }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return (
    <group name="catalog-bathroom-extractor-fan">
      <RoundedBox args={[0.18, 0.18, 0.05]} radius={0.018} smoothness={2} position={[0, 0.09, 0.025]} castShadow>
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.003} />
      </RoundedBox>
      <mesh position={[0, 0.09, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.05, 20]} />
        <ToonMaterial color={active ? "#849c95" : "#9ba29e"} />
      </mesh>
      <mesh position={[0, 0.09, 0.089]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.002, 16]} />
        <ToonMaterial color="#596460" />
      </mesh>
      {[-0.052, -0.017, 0.017, 0.052].map((y) => (
        <mesh key={y} position={[0, 0.09 + y, 0.0895]}>
          <boxGeometry args={[0.135, 0.007, 0.001]} />
          <ToonMaterial color="#d3d5cf" />
        </mesh>
      ))}
      <StatusBeacon visualState={visualState} position={[0.065, 0.152, 0.074]} scale={0.22} />
    </group>
  );
}
