import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { ActivityHologram } from "../../visuals/activity-hologram";
import { StatusBeacon } from "../../visuals/device-visual-state";

export function WaterHeaterModel({ visualState, reducedMotion }: HomeDeviceModelProps) {
  return (
    <group name="catalog-water-heater">
      <mesh position={[0, 0.79, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 1.14, 0.4]} />
        <ToonMaterial color="#e8e5dc" />
        <Outlines color="#797b76" thickness={0.006} />
      </mesh>
      <mesh position={[0, 1.36, 0]} scale={[1, 0.34, 0.72]} castShadow>
        <sphereGeometry args={[0.28, 18, 10]} />
        <ToonMaterial color="#ddd9cf" />
        <Outlines color="#797b76" thickness={0.005} />
      </mesh>
      <mesh position={[0, 0.42, 0.205]}>
        <boxGeometry args={[0.16, 0.12, 0.02]} />
        <ToonMaterial color="#26302f" />
        <Outlines color="#171d1c" thickness={0.003} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0, 0.42, 0.218]} />
      <ActivityHologram
        visualState={visualState}
        reducedMotion={reducedMotion}
        position={[0, 1.65, 0.24]}
      />
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, 0.11, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.22, 10]} />
          <ToonMaterial color="#9da4a1" />
        </mesh>
      ))}
    </group>
  );
}
