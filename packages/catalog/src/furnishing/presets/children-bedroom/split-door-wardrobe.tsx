import type { SceneModelProps } from "@cabane/engine";
import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel as Panel } from "../construction/rounded-furniture-panel";
export function SplitDoorWardrobe({ size, variant }: SceneModelProps) {
  return (
    <group
      name="split-door-wardrobe"
      userData={{ walkCollider: true }}
      scale={[size[0] / 2, size[1] / 2.52, size[2] / 0.6]}
    >
      <Panel
        size={[2, 2.52, 0.55]}
        position={[0, 1.26, -0.025]}
        color={variant === "sage" ? "#9dA38c" : "#c1bea0"}
        radius={0.003}
      />
      {[-0.75, -0.25, 0.25, 0.75].map((x, i) => (
        <group key={x}>
          {[
            [1.025, 1.946],
            [2.28, 0.474],
          ].map(([y, h]) => (
            <Panel
              key={y}
              size={[0.496, h, 0.024]}
              position={[x, y, 0.262]}
              color={variant === "sage" ? "#949b84" : "#bcb99b"}
              radius={0.002}
            />
          ))}
          {[1.05, 2.06].map((y) => (
            <mesh
              key={y}
              position={[x + (i % 2 === 0 ? 0.225 : -0.225), y, 0.284]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.016, 0.016, 0.032, 12]} />
              <ToonMaterial color={variant === "sage" ? "#c6b989" : "#353732"} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
