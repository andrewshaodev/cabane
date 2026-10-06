import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { deriveClimateAirflowMode } from "../../climate-airflow";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";
import { AirflowWaves } from "../../visuals/airflow-waves";

export function IndoorAcModel({
  state,
  visualState,
  reducedMotion,
}: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  const airflowMode = active ? deriveClimateAirflowMode(state) : null;
  return (
    <group name="catalog-indoor-ac">
      <mesh position={[0, 0.14, 0.085]} castShadow receiveShadow>
        <boxGeometry args={[0.84, 0.27, 0.17, 2, 2, 1]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.007} />
      </mesh>
      <mesh position={[0, 0.065, 0.177]}>
        <boxGeometry args={[0.68, 0.055, 0.015]} />
        <ToonMaterial color={palette.charcoal} />
      </mesh>
      <mesh
        position={[0, 0.045, 0.19]}
        rotation={[active ? -0.32 : -0.08, 0, 0]}
      >
        <boxGeometry args={[0.62, 0.018, 0.07]} />
        <ToonMaterial color={palette.bodyDark} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.32, 0.16, 0.178]} />
      {airflowMode && (
        <AirflowWaves
          mode={airflowMode}
          width={0.84}
          reducedMotion={reducedMotion}
        />
      )}
    </group>
  );
}
