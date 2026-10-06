import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const DESKTOP_MONITOR_SIZE = [0.54, 0.42, 0.18] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function DesktopMonitor({ size = DESKTOP_MONITOR_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="desktop-monitor" scale={[size[0] / 0.54, size[1] / 0.42, size[2] / 0.18]}>
      <RoundedFurniturePanel
        size={[0.25, 0.018, 0.18]}
        position={[0, 0.009, 0]}
        color="#353a3b"
        radius={0.01}
      />
      <RoundedFurniturePanel
        size={[0.035, 0.15, 0.035]}
        position={[0, 0.085, -0.035]}
        color="#404546"
      />
      <RoundedFurniturePanel
        size={[0.54, 0.3, 0.025]}
        position={[0, 0.27, -0.035]}
        color="#292f31"
        radius={0.005}
      />
      <RoundedFurniturePanel
        size={[0.514, 0.274, 0.003]}
        position={[0, 0.27, -0.021]}
        color="#87b4b9"
        radius={0.002}
        outline={false}
      />
    </group>
  );
}
