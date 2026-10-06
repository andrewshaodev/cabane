import { ToonMaterial, type SceneModelProps } from "@cabane/engine";

export const GARDEN_SHRUB_SIZE = [1.35, 0.92, 1.15] as const;

const clusters = [
  [-0.275, 0.4, 0, 0.4, "#557a4c"],
  [0.275, 0.42, 0.1, 0.4, "#668b57"],
  [0, 0.52, -0.175, 0.4, "#739760"],
  [-0.05, 0.3, 0.275, 0.3, "#4f7148"],
] as const;

export function GardenShrub({ size }: SceneModelProps) {
  return (
    <group
      name="garden-shrub"
      scale={[
        size[0] / GARDEN_SHRUB_SIZE[0],
        size[1] / GARDEN_SHRUB_SIZE[1],
        size[2] / GARDEN_SHRUB_SIZE[2],
      ]}
    >
      {clusters.map(([x, y, z, radius, color], index) => (
        <mesh key={index} position={[x, y, z]} castShadow receiveShadow>
          <sphereGeometry args={[radius, 8, 6]} />
          <ToonMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}
