import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Generic cordless electric kettle on its charging base; front faces +Z. */
export function ElectricKettleModel({ visualState }: HomeDeviceModelProps) {
  return <group name="catalog-electric-kettle" userData={{ walkCollider: true }}>
    <RoundedFurniturePanel size={[.22, .02, .2]} position={[0, .01, 0]}
      color="#505b57" radius={.01} outlineColor="#34403d" />
    <mesh name="kettle-body" position={[0, .12, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[.067, .088, .2, 18]} />
      <ToonMaterial color="#d8ddda" />
      <Outlines color="#596560" thickness={.003} />
    </mesh>
    <mesh name="kettle-lid" position={[0, .218, 0]}>
      <cylinderGeometry args={[.069, .069, .016, 18]} />
      <ToonMaterial color="#8d9893" />
    </mesh>
    <mesh name="kettle-lid-knob" position={[0, .242, 0]}>
      <sphereGeometry args={[.018, 12, 8]} />
      <ToonMaterial color="#52605b" />
    </mesh>
    <mesh name="kettle-spout" position={[-.05, .18, 0]} rotation={[0, 0, Math.PI / 3]}>
      <coneGeometry args={[.03, .1, 12]} />
      <ToonMaterial color="#c7cecb" />
    </mesh>
    <mesh name="kettle-handle" position={[.058, .145, 0]}>
      <torusGeometry args={[.04, .009, 6, 16, Math.PI * 1.55]} />
      <ToonMaterial color="#46514e" />
    </mesh>
    <StatusBeacon visualState={visualState} position={[.073, .045, .087]} scale={.22} />
  </group>;
}
