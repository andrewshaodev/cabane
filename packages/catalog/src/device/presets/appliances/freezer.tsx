import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Generic upright freezer; front faces +Z and the complete cabinet touches Y=0. */
export function FreezerModel({ visualState }: HomeDeviceModelProps) {
  return <group name="catalog-freezer" userData={{ walkCollider: true }}>
    {/* Reserve the front of the bounds for separate door and trim surfaces. */}
    <RoundedFurniturePanel size={[.65, 1.75, .656]} position={[0, .875, -.012]}
      color="#dfe3df" radius={.025} outlineColor="#52605b" />
    <RoundedFurniturePanel name="freezer-door" size={[.62, 1.68, .012]}
      position={[0, .875, .322]} color="#ebede9" radius={.012} outline={false} />
    {[.4, .75, 1.1, 1.45].map((y) => <mesh key={y} name="freezer-drawer-line" position={[0, y, .330]}>
      <boxGeometry args={[.54, .012, .002]} />
      <ToonMaterial color="#bdc5c1" />
    </mesh>)}
    <RoundedFurniturePanel name="freezer-handle" size={[.026, .72, .01]}
      position={[.275, 1.05, .335]} color="#7b8681" radius={.008} outline={false} />
    <RoundedFurniturePanel name="freezer-display" size={[.13, .065, .004]}
      position={[.14, 1.58, .332]} color="#31413f" radius={.004} outline={false} />
    <StatusBeacon visualState={visualState} position={[.185, 1.58, .332]} scale={.28} />
  </group>;
}
