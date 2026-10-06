import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const LOW_MEDIA_CONSOLE_SIZE = [1.6, 0.55, 0.42] as const;

/** Standalone low media cabinet; intentionally does not include a television. */
export function LowMediaConsole({ size = LOW_MEDIA_CONSOLE_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="low-media-console"
      scale={[size[0] / 1.6, size[1] / 0.55, size[2] / 0.42]}
      userData={{ walkCollider: true }}
    >
      {[-0.68, 0.68].flatMap((x) =>
        [-0.15, 0.15].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.035, z]} castShadow>
            <boxGeometry args={[0.05, 0.07, 0.05]} />
            <ToonMaterial color="#9d754c" />
          </mesh>
        )),
      )}
      <RoundedFurniturePanel
        size={[1.6, 0.45, 0.38]}
        position={[0, 0.295, -0.01]}
        color="#d7b782"
        radius={0.012}
      />
      {[-0.54, 0.54].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="media-console-door"
          size={[0.45, 0.34, 0.03]}
          position={[x, 0.3, 0.195]}
          color="#e5dfd2"
          radius={0.008}
        />
      ))}
      <RoundedFurniturePanel
        name="media-console-open-niche"
        size={[0.45, 0.27, 0.03]}
        position={[0, 0.335, 0.195]}
        color="#9b7a52"
        radius={0.006}
        outline={false}
      />
      <mesh
        name="media-console-cable-port"
        position={[0, 0.39, -0.205]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.035, 0.035, 0.01, 14]} />
        <ToonMaterial color="#594f43" />
      </mesh>
      <RoundedFurniturePanel
        size={[1.6, 0.03, 0.42]}
        position={[0, 0.535, 0]}
        color="#cfa873"
        radius={0.006}
      />
    </group>
  );
}
