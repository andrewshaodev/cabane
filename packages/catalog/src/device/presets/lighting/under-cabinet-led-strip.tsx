import { ToonMaterial, lightBrightnessRatio, type HomeDeviceModelProps } from "@cabane/engine";

export const UNDER_CABINET_LED_STRIP_SIZE = [1, 0.015, 0.025] as const;

/** Straight channel attaches by its top; the diffuser is visible from below. */
export function UnderCabinetLedStripModel({ state, visualState }: HomeDeviceModelProps) {
  const brightness = visualState === "connected-active" ? lightBrightnessRatio(state) : 0;
  return (
    <group name="under-cabinet-led-strip">
      <mesh name="led-strip-channel" position={[0, 0.0095, 0]} castShadow>
        <boxGeometry args={[1, 0.011, 0.025]} />
        <ToonMaterial color="#e4e2d8" />
      </mesh>
      <mesh name="led-strip-diffuser" position={[0, 0.002, 0]}>
        <boxGeometry args={[0.984, 0.004, 0.019]} />
        <ToonMaterial
          color={brightness > 0 ? "#fff0ca" : "#ddd8c8"}
          emissive="#ffd99b"
          emissiveIntensity={brightness * 0.6}
        />
      </mesh>
    </group>
  );
}
