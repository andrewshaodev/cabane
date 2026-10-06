import { ToonMaterial } from "@cabane/engine";
import type { SceneModelProps } from "@cabane/engine";
import { RoundedFurniturePanel as Panel } from "../construction/rounded-furniture-panel";
export function OpenCubeBookcase({ size }: SceneModelProps) {
  return (
    <group
      name="open-cube-bookcase"
      userData={{ walkCollider: true }}
      scale={[size[0] / 0.8, size[1] / 1.5, size[2] / 0.28]}
    >
      {[-0.39, 0.39].map((x) => (
        <Panel
          key={x}
          size={[0.02, 1.5, 0.28]}
          position={[x, 0.75, 0]}
          color="#8d9788"
          radius={0.002}
        />
      ))}
      <Panel
        size={[0.76, 1.5, 0.012]}
        position={[0, 0.75, -0.134]}
        color="#89917f"
        radius={0.002}
      />
      <Panel size={[0.02, 1.5, 0.268]} position={[0, 0.75, 0.006]} color="#8d9788" radius={0.002} />
      {[0.01, 0.38, 0.75, 1.12, 1.49].map((y) => (
        <Panel
          key={y}
          size={[0.76, 0.02, 0.268]}
          position={[0, y, 0.006]}
          color="#8d9788"
          radius={0.002}
        />
      ))}
      {[0.08, 0.45, 0.82, 1.19].flatMap((y) =>
        [-0.34, -0.28, -0.22, -0.16, 0.08, 0.14, 0.2, 0.26].map((x, i) => (
          <mesh key={`${y}-${x}`} position={[x, y + 0.125, 0]}>
            <boxGeometry args={[0.045, 0.25, 0.18]} />
            <ToonMaterial color={["#476479", "#d3bc94", "#b67867", "#e4dfd0"][i % 4]} />
          </mesh>
        )),
      )}
    </group>
  );
}
