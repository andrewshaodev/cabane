import type { HomeDeviceModelProps } from "@cabane/engine";
import { AirflowWaves } from "../../visuals/airflow-waves";
import { fanSpeedFactor } from "./fan-operation";

/** The AC's cold waves, directed straight ahead from a portable fan's guard. */
export function FanAirflow(props: HomeDeviceModelProps) {
  if (fanSpeedFactor(props) === 0) return null;
  return (
    <group name="fan-airflow" scale={0.5}>
      <AirflowWaves mode="cool" width={0.7} reducedMotion={props.reducedMotion} forward />
    </group>
  );
}
