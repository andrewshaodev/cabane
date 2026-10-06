import { lightBrightnessRatio, Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";

const TERRACOTTA = "#ad5436";
const TERRACOTTA_LIGHT = "#c86a46";
const TERRACOTTA_DARK = "#6f321f";

const bulbColor = (visualState: HomeDeviceModelProps["visualState"]) => {
  switch (visualState) {
    case "connected-active":
      return { color: "#ffe8b9", emissive: "#e5a54d", intensity: 0.9 };
    case "unavailable":
      return { color: "#b28b69", emissive: "#4f3526", intensity: 0.18 };
    case "connected-inactive":
      return { color: "#b8ab92", emissive: "#000000", intensity: 0 };
    case "disconnected":
      return { color: "#c7b99e", emissive: "#000000", intensity: 0 };
  }
};

export function TerracottaPendantModel({ state, visualState }: HomeDeviceModelProps) {
  const bulb = bulbColor(visualState);
  const brightness = lightBrightnessRatio(state);

  return (
    <group name="catalog-terracotta-pendant">
      <mesh castShadow position={[0, 0.608, 0]}>
        <cylinderGeometry args={[0.055, 0.075, 0.064, 24]} />
        <ToonMaterial color={TERRACOTTA_DARK} />
        <Outlines color="#43251d" thickness={0.005} screenspace={false} />
      </mesh>
      <mesh castShadow position={[0, 0.49, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.19, 10]} />
        <ToonMaterial color="#574b44" />
      </mesh>
      <mesh castShadow position={[0, 0.375, 0]}>
        <cylinderGeometry args={[0.055, 0.072, 0.1, 28]} />
        <ToonMaterial color={TERRACOTTA_DARK} />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.072, 0.19, 0.1, 32, 1, true]} />
        <ToonMaterial color={TERRACOTTA_LIGHT} side={2} />
      </mesh>
      <mesh castShadow position={[0, 0.175, 0]}>
        <cylinderGeometry args={[0.19, 0.315, 0.2, 36, 1, true]} />
        <ToonMaterial color={TERRACOTTA} side={2} />
        <Outlines color={TERRACOTTA_DARK} thickness={0.008} screenspace={false} />
      </mesh>
      <mesh castShadow position={[0, 0.068, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.298, 0.021, 10, 36]} />
        <ToonMaterial color={TERRACOTTA_DARK} />
      </mesh>
      <mesh position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.026, 0.035, 0.105, 18]} />
        <ToonMaterial color="#6f5c49" />
      </mesh>
      <mesh name="terracotta-pendant-emitter" position={[0, 0.065, 0]}>
        <sphereGeometry args={[0.066, 20, 14]} />
        <ToonMaterial
          color={bulb.color}
          emissive={bulb.emissive}
          emissiveIntensity={bulb.intensity * brightness}
        />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.07, 0.515, 0]} scale={0.6} />
    </group>
  );
}
