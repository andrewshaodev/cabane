import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Generic countertop microwave; front faces +Z and Y=0 is the supporting surface. */
export function MicrowaveModel({ visualState }: HomeDeviceModelProps) {
  return <group name="catalog-microwave" userData={{ walkCollider: true }}>
    <RoundedFurniturePanel size={[.52, .31, .4]} position={[0, .155, 0]}
      color="#d7dcda" radius={.012} outlineColor="#56615e" />
    <RoundedFurniturePanel name="microwave-door" size={[.36, .245, .01]}
      position={[-.055, .145, .195]} color="#4d5c5c" radius={.006} outline={false} />
    <RoundedFurniturePanel name="microwave-window" size={[.302, .186, .004]}
      position={[-.067, .145, .198]} color="#263434" radius={.004} outline={false} />
    <RoundedFurniturePanel size={[.105, .245, .008]} position={[.19, .145, .196]}
      color="#c2c9c6" radius={.004} outline={false} />
    <RoundedFurniturePanel name="microwave-display" size={[.075, .04, .003]}
      position={[.19, .229, .199]} color="#31413f" radius={.002} outline={false} />
    {[.17, .122, .074].map((y) => <mesh key={y} position={[.19, y, .1985]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.014, .014, .004, 12]} />
      <ToonMaterial color="#697671" />
    </mesh>)}
    <mesh position={[.122, .145, .1985]} castShadow>
      <boxGeometry args={[.018, .16, .004]} />
      <ToonMaterial color="#bac2c0" />
    </mesh>
    <StatusBeacon visualState={visualState} position={[.218, .23, .194]} scale={.22} />
  </group>;
}
