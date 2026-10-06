import { Outlines, ToonMaterial, type HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";
import { FanHead } from "./fan-head";
import { FanAirflow } from "./fan-airflow";

export function TableFanModel(props: HomeDeviceModelProps) {
  return <group name="catalog-table-fan">
    <group name="fan-body" userData={{ walkCollider: true }}>
      <mesh name="fan-base" position={[0, .013, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[.105, .12, .026, 32]} />
        <ToonMaterial color={palette.body} />
      </mesh>
      <mesh name="fan-neck" position={[0, .16, -.075]} castShadow>
        <cylinderGeometry args={[.02, .032, .28, 16]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={.0015} screenspace={false} />
      </mesh>
      <group position={[0, .30, 0]}><FanHead {...props} /></group>
      <StatusBeacon visualState={props.visualState} position={[0, .027, .065]} scale={.45} />
    </group>
    <group position={[0, .30, 0]}><FanAirflow {...props} /></group>
  </group>;
}
