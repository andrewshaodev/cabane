import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OAK_NIGHTSTAND_SIZE = [0.45, 0.5, 0.4] as const;

export function OakNightstand({ size = OAK_NIGHTSTAND_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="oak-nightstand"
      scale={[size[0] / 0.45, size[1] / 0.5, size[2] / 0.4]}
      userData={{ walkCollider: true }}
    >
      {[-0.178, 0.178].flatMap((x) =>
        [-0.145, 0.145].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.06, z]} castShadow>
            <boxGeometry args={[0.035, 0.12, 0.035]} />
            <ToonMaterial color="#b99262" />
          </mesh>
        )),
      )}
      <RoundedFurniturePanel size={[0.45, 0.025, 0.4]} position={[0, 0.4875, 0]} color="#dbbc8d" />
      {[-0.2125, 0.2125].map((x) => (
        <RoundedFurniturePanel
          key={x}
          size={[0.025, 0.37, 0.4]}
          position={[x, 0.29, 0]}
          color="#cfad7b"
          radius={0.004}
        />
      ))}
      <RoundedFurniturePanel
        size={[0.4, 0.025, 0.375]}
        position={[0, 0.1225, -0.0125]}
        color="#cba674"
        radius={0.004}
      />
      <RoundedFurniturePanel
        size={[0.4, 0.34, 0.018]}
        position={[0, 0.305, -0.191]}
        color="#b69262"
        radius={0.003}
        outline={false}
      />
      <RoundedFurniturePanel
        size={[0.4, 0.024, 0.36]}
        position={[0, 0.291, -0.012]}
        color="#c7a16e"
        radius={0.003}
      />
      <RoundedFurniturePanel
        name="nightstand-drawer"
        size={[0.394, 0.163, 0.022]}
        position={[0, 0.38, 0.18]}
        color="#d6b584"
        radius={0.004}
      />
      <mesh name="nightstand-finger-pull" position={[0, 0.432, 0.193]}>
        <boxGeometry args={[0.1, 0.012, 0.004]} />
        <ToonMaterial color="#846748" />
      </mesh>
    </group>
  );
}
