import { Outlines, ToonMaterial, type HomeDeviceModelProps } from "@cabane/engine";
import { palette } from "../../visuals/device-visual-state";
import { FanGuard } from "./fan-guard";
import { FanRotor } from "./fan-rotor";

/** 36 cm guarded head, facing +Z, with its motor behind the blades. */
export function FanHead(props: HomeDeviceModelProps) {
  return <group name="fan-head">
    <mesh name="fan-motor" position={[0, 0, -.065]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[.055, .05, .10, 20]} />
      <ToonMaterial color={palette.body} />
      <Outlines color={palette.charcoal} thickness={.0015} screenspace={false} />
    </mesh>
    <group position={[0, 0, .012]}>
      <FanRotor {...props} radius={.153} count={3} color={palette.bodyDark} />
    </group>
    <mesh name="fan-hub" position={[0, 0, .012]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[.033, .033, .075, 20]} />
      <ToonMaterial color={palette.body} />
      <Outlines color={palette.charcoal} thickness={.0015} screenspace={false} />
    </mesh>
    <FanGuard />
  </group>;
}
