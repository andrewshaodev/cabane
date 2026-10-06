import { KeyboardCrossStand } from "./keyboard-cross-stand";
import { ToonMaterial } from "@cabane/engine";
import type { SceneModelProps } from "@cabane/engine";
import { RoundedFurniturePanel as Panel } from "../construction/rounded-furniture-panel";
export function PortableDigitalPiano({ size }: SceneModelProps) {
  return (
    <group
      name="portable-digital-piano"
      userData={{ walkCollider: true }}
      scale={[size[0] / 1.3, size[1] / 0.84, size[2] / 0.34]}
    >
      <Panel size={[1.3, 0.075, 0.31]} position={[0, 0.7725, 0]} color="#292b2c" />
      {Array.from({ length: 52 }, (_, i) => (
        <mesh key={i} position={[-0.596 + i * 0.0234, 0.817, 0.08]}>
          <boxGeometry args={[0.022, 0.014, 0.135]} />
          <ToonMaterial color="#f1eee5" />
        </mesh>
      ))}
      {Array.from({ length: 51 }, (_, i) =>
        [0, 1, 3, 4, 5].includes(i % 7) ? (
          <mesh key={i} position={[-0.584 + i * 0.0234, 0.8335, 0.0525]}>
            <boxGeometry args={[0.012, 0.013, 0.08]} />
            <ToonMaterial color="#1d2123" />
          </mesh>
        ) : null,
      )}
      <KeyboardCrossStand />
    </group>
  );
}
