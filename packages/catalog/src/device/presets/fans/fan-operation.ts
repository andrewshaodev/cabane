import type { HomeDeviceModelProps } from "@cabane/engine";

/** HA power and percentage jointly determine whether the rotor produces airflow. */
export function fanSpeedFactor({
  state,
  visualState,
}: Pick<HomeDeviceModelProps, "state" | "visualState">) {
  if (visualState !== "connected-active" || state?.state !== "on") return 0;
  const percentage = state.attributes.percentage;
  return typeof percentage === "number" && Number.isFinite(percentage)
    ? Math.max(0, Math.min(100, percentage)) / 100
    : 0.5;
}
