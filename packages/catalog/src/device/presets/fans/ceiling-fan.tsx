import { Outlines, ToonMaterial, type HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";
import { FanRotor } from "./fan-rotor";

/** The canopy contacts the ceiling at local Y=.40; the motor bottom is Y=0. */
export function CeilingFanModel(props: HomeDeviceModelProps) {
  return <group name="catalog-ceiling-fan">
    <mesh name="fan-canopy" position={[0, .375, 0]} castShadow>
      <cylinderGeometry args={[.08, .055, .05, 24]} />
      <ToonMaterial color={palette.body} />
    </mesh>
    <mesh name="fan-downrod" position={[0, .245, 0]} castShadow>
      <cylinderGeometry args={[.014, .014, .24, 12]} />
      <ToonMaterial color={palette.charcoal} />
    </mesh>
    <mesh name="fan-motor" position={[0, .07, 0]} castShadow>
      <cylinderGeometry args={[.09, .07, .14, 24]} />
      <ToonMaterial color={palette.body} />
      <Outlines color={palette.charcoal} thickness={.0015} screenspace={false} />
    </mesh>
    <group position={[0, .10, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <FanRotor {...props} radius={.60} count={4} color="#b99367" />
    </group>
    <StatusBeacon visualState={props.visualState} position={[0, .045, .078]} scale={.45} />
  </group>;
}
