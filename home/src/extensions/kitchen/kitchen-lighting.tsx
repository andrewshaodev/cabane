import { lightBrightnessRatio, ToonMaterial } from "@cabane/engine";
import type { EntityStateSnapshot } from "@cabane/engine";
import {
  KITCHEN_CEILING_MOUNT_OFFSET,
  UNDER_CABINET_STRIP_Y,
  upperCabinets,
} from "./kitchen-cabinetry";
import { KitchenBox } from "./kitchen-finish";

const LIGHT_ON = "#fff2c8";
const LIGHT_GLOW = "#f2b75c";
const GLASS_CABINET_SPOT_Y = 1.35 + 0.66 / 2 - 0.022;

export function KitchenLighting({ state }: { state?: EntityStateSnapshot }) {
  const brightness = lightBrightnessRatio(state);
  return (
    <group name="eclairage-cuisine-custom">
      {upperCabinets.filter((cabinet) => cabinet.kind === "glass").map((cabinet) => (
        <group key={cabinet.center} position={[cabinet.center, KITCHEN_CEILING_MOUNT_OFFSET, 0]}>
          <mesh position={[0, GLASS_CABINET_SPOT_Y, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.017, 0.027, 20]} />
            <ToonMaterial color="#ddd7ca" />
          </mesh>
          <mesh position={[0, GLASS_CABINET_SPOT_Y - 0.001, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.016, 20]} />
            <ToonMaterial
              color={brightness > 0 ? LIGHT_ON : "#b9b1a0"}
              emissive={LIGHT_GLOW}
              emissiveIntensity={brightness * 0.15}
            />
          </mesh>
        </group>
      ))}
      <KitchenBox
        size={[2.96, 0.025, 0.055]}
        position={[2.27, UNDER_CABINET_STRIP_Y, 0.38]}
        color="#d9d4ca"
        outline="#746e65"
      />
      <mesh
        name="kitchen-light-strip-emitter"
        position={[2.27, UNDER_CABINET_STRIP_Y - 0.017, 0.38]}
      >
        <boxGeometry args={[2.9, 0.008, 0.038]} />
        <ToonMaterial
          color={brightness > 0 ? LIGHT_ON : "#b9b1a0"}
          emissive={LIGHT_GLOW}
          emissiveIntensity={brightness * 0.27}
        />
      </mesh>
    </group>
  );
}
