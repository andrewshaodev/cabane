import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../../furnishing/presets/construction/rounded-furniture-panel";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Front layers are separated in depth: housing 0.18, door/panel 0.195, glass 0.20.
 * Generic countertop microwave; front faces +Z and Y=0 is the supporting surface. */
export function MicrowaveModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-microwave" userData={{ walkCollider: true }}>
      <RoundedFurniturePanel
        name="microwave-housing"
        glowKey="microwave.housing"
        size={[0.52, 0.31, 0.38]}
        position={[0, 0.155, -0.01]}
        color="#d7dcda"
        radius={0.012}
        outlineColor="#56615e"
      />
      <RoundedFurniturePanel
        name="microwave-door"
        glowKey="microwave.door"
        size={[0.36, 0.245, 0.01]}
        position={[-0.055, 0.145, 0.19]}
        color="#4d5c5c"
        radius={0.006}
        outline={false}
      />
      <RoundedFurniturePanel
        name="microwave-window"
        glowKey="microwave.window"
        size={[0.302, 0.186, 0.004]}
        position={[-0.067, 0.145, 0.198]}
        color={visualState === "connected-active" ? "#e6a359" : "#263434"}
        radius={0.004}
        outline={false}
      />
      <RoundedFurniturePanel
        name="microwave-control-panel"
        glowKey="microwave.control-panel"
        size={[0.105, 0.245, 0.01]}
        position={[0.19, 0.145, 0.19]}
        color="#c2c9c6"
        radius={0.004}
        outline={false}
      />
      <RoundedFurniturePanel
        name="microwave-display"
        glowKey="microwave.display"
        size={[0.075, 0.04, 0.003]}
        position={[0.19, 0.229, 0.1985]}
        color="#31413f"
        radius={0.002}
        outline={false}
      />
      {(
        [
          [0.17, "upper"],
          [0.122, "middle"],
          [0.074, "lower"],
        ] as const
      ).map(([y, key]) => (
        <mesh
          userData={{ modelGlowKey: `microwave.button.${key}` }}
          key={key}
          position={[0.19, y, 0.198]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.014, 0.014, 0.004, 12]} />
          <ToonMaterial color="#697671" />
        </mesh>
      ))}
      <mesh
        userData={{ modelGlowKey: "microwave.handle" }}
        position={[0.122, 0.145, 0.198]}
        castShadow
      >
        <boxGeometry args={[0.018, 0.16, 0.004]} />
        <ToonMaterial color="#bac2c0" />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.218, 0.23, 0.194]} scale={0.22} />
    </group>
  );
}
