/** Sample a cleaning pose in model-space meters/radians at elapsed seconds. */
export function sampleVacuumFlight(time: number) {
  return {
    x: Math.sin(time * 0.23) * 0.55 + Math.sin(time * 0.61) * 0.2,
    z: Math.sin(time * 0.31) * 0.55 + Math.sin(time * 0.47) * 0.2,
    height: 1.5 + Math.sin(time * 1.6) * 0.3 + Math.sin(time * 0.73) * 0.09,
    pitch: Math.sin(time * 1.1) * 0.075,
    yaw: time * 0.35,
    roll: Math.sin(time * 0.83) * 0.075,
  };
}
