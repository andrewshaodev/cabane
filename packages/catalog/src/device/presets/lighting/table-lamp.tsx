import { lightBrightnessRatio, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { connectedLightFinish } from "./connected-light-finish";

export const TABLE_LAMP_SIZE = [0.32, 0.52, 0.32] as const;

export function TableLampModel({
  state,
  visualState,
}: Pick<HomeDeviceModelProps, "state" | "visualState">) {
  const finish = connectedLightFinish(visualState);
  return (
    <group name={`device-state-${visualState}`}>
      <mesh name="table-lamp-base" position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.16, 20]} />
        <ToonMaterial color="#ded7c8" />
      </mesh>
      <mesh name="table-lamp-neck" position={[0, 0.245, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.19, 12]} />
        <ToonMaterial color="#8d867b" />
      </mesh>
      <mesh name="table-lamp-shade" position={[0, 0.39, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.26, 24, 1, true]} />
        <ToonMaterial
          color={finish.color}
          emissive="#f2c66d"
          emissiveIntensity={finish.emissiveIntensity * 0.45 * lightBrightnessRatio(state)}
          side={2}
        />
      </mesh>
      <mesh name="table-lamp-shade-top" position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.018, 0.12, 24]} />
        <ToonMaterial color={finish.color} side={2} />
      </mesh>
    </group>
  );
}
