import type { SceneModelProps } from "@cabane/engine";
import { RoundedFurniturePanel as Panel } from "../construction/rounded-furniture-panel";
export function StudentStorageDesk({ size }: SceneModelProps) {
  return (
    <group
      name="student-storage-desk"
      userData={{ walkCollider: true }}
      scale={[size[0] / 1.05, size[1] / 0.75, size[2] / 0.5]}
    >
      <Panel size={[1.05, 0.03, 0.5]} position={[0, 0.735, 0]} color="#efeee7" />
      {[-0.5125, -0.2375, 0.5125, 0.2375].map((x) => (
        <Panel key={x} size={[0.025, 0.72, 0.48]} position={[x, 0.36, 0]} color="#efeee7" />
      ))}
      {[-0.375, 0.375].map((x) => (
        <Panel key={x} size={[0.25, 0.025, 0.48]} position={[x, 0.0125, 0]} color="#efeee7" />
      ))}
      <Panel size={[1, 0.11, 0.02]} position={[0, 0.635, -0.222]} color="#e8e5de" />
      <Panel size={[1, 0.02, 0.48]} position={[0, 0.57, 0]} color="#efeee7" />
      {[0.16, 0.32, 0.48].map((y) => (
        <Panel key={y} size={[0.25, 0.145, 0.02]} position={[-0.375, y, 0.23]} color="#c4a985" />
      ))}
      <Panel size={[0.25, 0.51, 0.02]} position={[0.375, 0.3, 0.23]} color="#c4a985" />
    </group>
  );
}
