import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Generic filter coffee maker with a glass carafe; front faces +Z. */
export function CoffeeMakerModel({ visualState }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return <group name="catalog-coffee-maker" userData={{ walkCollider: true }}>
    <RoundedFurniturePanel size={[.24, .025, .34]} position={[0, .0125, 0]}
      color="#59635f" radius={.006} outlineColor="#35413e" />
    <RoundedFurniturePanel size={[.2, .31, .16]} position={[0, .18, -.075]}
      color="#e3e1da" radius={.018} outlineColor="#64706c" />
    <RoundedFurniturePanel size={[.2, .025, .16]} position={[0, .3475, -.075]}
      color="#c5ccc8" radius={.008} outline={false} />
    <RoundedFurniturePanel name="coffee-maker-brew-head" size={[.16, .05, .12]}
      position={[0, .274, .055]} color="#59635f" radius={.008} outline={false} />
    <mesh name="coffee-maker-carafe" position={[0, .105, .075]} castShadow>
      <cylinderGeometry args={[.063, .074, .15, 16]} />
      <ToonMaterial color="#9cb4b1" transparent opacity={.68} />
      <Outlines color="#52605b" thickness={.002} />
    </mesh>
    <mesh name="coffee-maker-carafe-handle" position={[.075, .13, .075]}>
      <torusGeometry args={[.035, .008, 6, 16, Math.PI * 1.75]} />
      <ToonMaterial color="#46514e" />
    </mesh>
    <RoundedFurniturePanel name="coffee-maker-display" size={[.09, .035, .004]}
      position={[0, .218, .007]} color="#31413f" radius={.002} outline={false} />
    <mesh position={[-.067, .218, .01]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.013, .013, .004, 12]} />
      <ToonMaterial color="#718078" emissive={active ? "#d96e4d" : "#718078"}
        emissiveIntensity={active ? .3 : 0} />
    </mesh>
    <StatusBeacon visualState={visualState} position={[.07, .218, .01]} scale={.2} />
  </group>;
}
