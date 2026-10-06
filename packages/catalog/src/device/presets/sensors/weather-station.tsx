import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

/** Generic indoor weather-station console; front faces +Z. */
export function WeatherStationModel({ state, visualState }: HomeDeviceModelProps) {
  const numeric = Number(state?.state);
  const active = visualState === "connected-active" && Number.isFinite(numeric);
  return (
    <group name="catalog-weather-station" userData={{ walkCollider: true }}>
      <RoundedFurniturePanel
        size={[0.18, 0.12, 0.04]}
        position={[0, 0.06, 0]}
        color="#d9ded9"
        radius={0.012}
        outlineColor="#52605b"
      />
      <RoundedFurniturePanel
        name="weather-station-display"
        size={[0.148, 0.09, 0.003]}
        position={[0, 0.064, 0.0185]}
        color="#344644"
        radius={0.005}
        outline={false}
      />
      <mesh
        name="weather-station-sun"
        position={[-0.043, 0.082, 0.019]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.015, 0.015, 0.002, 12]} />
        <ToonMaterial
          color={palette.amber}
          emissive={active ? palette.amber : "#7a806f"}
          emissiveIntensity={active ? 0.3 : 0.04}
        />
      </mesh>
      {[0.035, 0.05, 0.065].map((x, index) => (
        <mesh key={x} position={[x, 0.044 + index * 0.008, 0.019]}>
          <boxGeometry args={[0.009, 0.026 + index * 0.012, 0.002]} />
          <ToonMaterial color={active ? palette.paleBlue : palette.muted} />
        </mesh>
      ))}
      <StatusBeacon visualState={visualState} position={[0.07, 0.101, 0.014]} scale={0.16} />
    </group>
  );
}
