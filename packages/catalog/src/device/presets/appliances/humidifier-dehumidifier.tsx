import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

/** Generic floor-standing humidity appliance; front faces +Z. */
export function HumidifierDehumidifierModel({ visualState }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return (
    <group name="catalog-humidifier-dehumidifier" userData={{ walkCollider: true }}>
      <RoundedBox args={[0.32, 0.6, 0.28]} radius={0.035} smoothness={2} position={[0, 0.3, 0]} castShadow receiveShadow>
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.005} />
      </RoundedBox>
      <mesh name="humidity-appliance-water-tank" position={[0, 0.135, 0.138]}>
        <boxGeometry args={[0.17, 0.17, 0.004]} />
        <ToonMaterial color="#9dbfc0" opacity={0.72} transparent />
      </mesh>
      {[0.36, 0.39, 0.42, 0.45].map((y) => (
        <mesh key={y} position={[0, y, 0.138]}>
          <boxGeometry args={[0.2, 0.012, 0.004]} />
          <ToonMaterial color="#929d98" />
        </mesh>
      ))}
      <mesh position={[0, 0.597, 0]}>
        <boxGeometry args={[0.2, 0.006, 0.14]} />
        <ToonMaterial color="#6d7974" />
      </mesh>
      <mesh position={[0, 0.535, 0.138]}>
        <boxGeometry args={[0.105, 0.042, 0.004]} />
        <ToonMaterial
          color="#33423f"
          emissive={active ? palette.paleBlue : "#41514e"}
          emissiveIntensity={active ? 0.38 : 0.08}
        />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.105, 0.558, 0.126]} scale={0.25} />
    </group>
  );
}
