import { Outlines, ToonMaterial, type HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";
import { FanHead } from "./fan-head";
import { FanAirflow } from "./fan-airflow";

export function PedestalFanModel(props: HomeDeviceModelProps) {
  return <group name="catalog-pedestal-fan">
    <group name="fan-body" userData={{ walkCollider: true }}>
      <mesh name="fan-base" position={[0, .025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[.17, .20, .05, 32]} />
        <ToonMaterial color={palette.body} />
      </mesh>
      <mesh name="fan-lower-post" position={[0, .395, -.075]} castShadow>
        <cylinderGeometry args={[.026, .037, .71, 16]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={.0015} screenspace={false} />
      </mesh>
      <mesh name="fan-upper-post" position={[0, .92, -.075]} castShadow>
        <cylinderGeometry args={[.017, .017, .41, 12]} />
        <ToonMaterial color={palette.charcoal} />
      </mesh>
      <group position={[0, 1.125, 0]} scale={1.25}><FanHead {...props} /></group>
      <StatusBeacon visualState={props.visualState} position={[0, .64, -.043]} scale={.5} />
    </group>
    <group position={[0, 1.125, 0]} scale={1.25}><FanAirflow {...props} /></group>
  </group>;
}
