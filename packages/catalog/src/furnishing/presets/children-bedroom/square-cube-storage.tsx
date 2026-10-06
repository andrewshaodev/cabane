import type { SceneModelProps } from "@cabane/engine";
import { RoundedFurniturePanel as Panel } from "../construction/rounded-furniture-panel";
export function SquareCubeStorage({ size, variant }: SceneModelProps) {
  return (
    <group
      name="square-cube-storage"
      userData={{ walkCollider: true }}
      scale={[size[0] / 0.77, size[1] / 0.77, size[2] / 0.39]}
    >
      {[-0.375, 0.375].map((x) => (
        <Panel key={x} size={[0.02, 0.77, 0.39]} position={[x, 0.385, 0]} color="#f1eee5" />
      ))}
      {[0.01, 0.76].map((y) => (
        <Panel key={y} size={[0.73, 0.02, 0.39]} position={[0, y, 0]} color="#f1eee5" />
      ))}
      {variant !== "two-compartment" && (
        <Panel size={[0.73, 0.02, 0.37]} position={[0, 0.385, 0]} color="#f1eee5" />
      )}
      <Panel size={[0.02, 0.73, 0.37]} position={[0, 0.385, 0]} color="#f1eee5" />
      {variant === "two-compartment" ? (
        <>
          <Panel size={[0.73, 0.73, 0.01]} position={[0, 0.385, -0.19]} color="#e9e5dc" />
          <Panel size={[0.35, 0.69, 0.016]} position={[0.185, 0.385, 0.181]} color="#c3a57e" />
          <Panel
            size={[0.32, 0.29, 0.33]}
            position={[-0.185, 0.22, 0.01]}
            color="#dfdcd1"
            radius={0.018}
          />
        </>
      ) : (
        <>
          {[0.575, 0.195].map((y) => (
            <Panel
              key={y}
              size={[0.33, 0.33, 0.016]}
              position={[0.185, y, 0.181]}
              color="#c3a57e"
            />
          ))}
          {[0.541, 0.166].map((y) => (
            <Panel
              key={y}
              size={[0.32, 0.29, 0.33]}
              position={[-0.185, y, 0.01]}
              color="#dfdcd1"
              radius={0.018}
            />
          ))}
        </>
      )}
    </group>
  );
}
