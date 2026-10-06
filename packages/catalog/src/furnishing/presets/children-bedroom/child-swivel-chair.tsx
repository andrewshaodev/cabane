import type { SceneModelProps } from "@cabane/engine";
import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel as Panel } from "../construction/rounded-furniture-panel";
export function ChildSwivelChair({ size }: SceneModelProps) {
  return (
    <group
      name="child-swivel-chair"
      userData={{ walkCollider: true }}
      scale={[size[0] / 0.44, size[1] / 0.79, size[2] / 0.44]}
    >
      <Panel size={[0.39, 0.04, 0.37]} position={[0, 0.435, 0.02]} color="#eeeae0" radius={0.018} />
      <Panel
        size={[0.36, 0.32, 0.025]}
        position={[0, 0.63, -0.17]}
        color="#eeeae0"
        radius={0.025}
      />
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.715, -0.153]}>
          <circleGeometry args={[0.023, 16]} />
          <ToonMaterial color="#b6b4a8" />
        </mesh>
      ))}
      <Panel size={[0.035, 0.39, 0.035]} position={[0, 0.215, 0]} color="#e4e0d7" />
      <Panel size={[0.44, 0.03, 0.045]} position={[0, 0.015, 0]} color="#e4e0d7" />
      <Panel size={[0.045, 0.03, 0.44]} position={[0, 0.015, 0]} color="#e4e0d7" />
    </group>
  );
}
