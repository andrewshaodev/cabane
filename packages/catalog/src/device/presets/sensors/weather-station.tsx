import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

/** Generic indoor weather-station console; front faces +Z. */
export function WeatherStationModel({ state, visualState }: HomeDeviceModelProps) {
  const numeric = Number(state?.state);
  const active = visualState === "connected-active" && Number.isFinite(numeric);
  return <group name="catalog-weather-station" userData={{ walkCollider: true }}>
    <RoundedFurniturePanel size={[.18, .12, .04]} position={[0, .06, 0]}
      color="#d9ded9" radius={.012} outlineColor="#52605b" />
    <RoundedFurniturePanel name="weather-station-display" size={[.148, .09, .003]}
      position={[0, .064, .0185]} color="#344644" radius={.005} outline={false} />
    <mesh name="weather-station-sun" position={[-.043, .082, .019]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.015, .015, .002, 12]} />
      <ToonMaterial color={palette.amber} emissive={active ? palette.amber : "#7a806f"}
        emissiveIntensity={active ? .3 : .04} />
    </mesh>
    {[.035, .05, .065].map((x, index) => <mesh key={x} position={[x, .044 + index * .008, .019]}>
      <boxGeometry args={[.009, .026 + index * .012, .002]} />
      <ToonMaterial color={active ? palette.paleBlue : palette.muted} />
    </mesh>)}
    <StatusBeacon visualState={visualState} position={[.07, .101, .014]} scale={.16} />
  </group>;
}
