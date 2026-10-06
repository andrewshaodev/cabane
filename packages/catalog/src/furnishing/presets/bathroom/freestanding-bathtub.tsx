import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FREESTANDING_BATHTUB_SIZE = [1.7, 0.6, 0.78] as const;

/** Warm-white freestanding bath with a visible inner basin, drain, and overflow. */
export function FreestandingBathtub({
  size = FREESTANDING_BATHTUB_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="freestanding-bathtub"
      scale={[size[0] / 1.7, size[1] / 0.6, size[2] / 0.78]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="bathtub-base"
        size={[1.7, 0.14, 0.78]}
        position={[0, 0.07, 0]}
        color="#eeeae0"
        radius={0.08}
      />
      {[-0.81, 0.81].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="bathtub-side"
          size={[0.08, 0.46, 0.78]}
          position={[x, 0.37, 0]}
          color="#f1ede4"
          radius={0.035}
        />
      ))}
      {[-0.35, 0.35].map((z) => (
        <RoundedFurniturePanel
          key={z}
          name="bathtub-end"
          size={[1.54, 0.46, 0.08]}
          position={[0, 0.37, z]}
          color="#f1ede4"
          radius={0.035}
        />
      ))}
      <RoundedFurniturePanel
        name="bathtub-inner-basin"
        size={[1.42, 0.07, 0.54]}
        position={[0, 0.19, 0]}
        color="#cbd8d7"
        radius={0.09}
        outlineColor="#8a9997"
      />
      <mesh name="bathtub-drain" position={[0.42, 0.228, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.008, 20]} />
        <ToonMaterial color="#7e8b89" />
      </mesh>
      <mesh name="bathtub-overflow" position={[-0.73, 0.39, 0.311]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.012, 18]} />
        <ToonMaterial color="#7e8b89" />
      </mesh>
    </group>
  );
}
