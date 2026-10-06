import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const KITCHEN_TROLLEY_SIZE = [0.7, 0.9, 0.45] as const;

/** Oak worktop, two lower shelves, steel posts and four casters. */
export function KitchenTrolley({ size = KITCHEN_TROLLEY_SIZE }: { size?: SceneItemSize } = {}) {
  return (
    <group
      name="kitchen-trolley"
      scale={[size[0] / 0.7, size[1] / 0.9, size[2] / 0.45]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="worktop"
        size={[0.7, 0.04, 0.45]}
        position={[0, 0.88, 0]}
        color="#bd9367"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.035, 0.78, 0.035]}
        position={[-0.3, 0.47000000000000003, -0.175]}
        color="#606b70"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.035, 0.78, 0.035]}
        position={[-0.3, 0.47000000000000003, 0.175]}
        color="#606b70"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.035, 0.78, 0.035]}
        position={[0.3, 0.47000000000000003, -0.175]}
        color="#606b70"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="leg"
        size={[0.035, 0.78, 0.035]}
        position={[0.3, 0.47000000000000003, 0.175]}
        color="#606b70"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="shelf"
        size={[0.6, 0.025, 0.35]}
        position={[0, 0.14, 0]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="shelf"
        size={[0.6, 0.025, 0.35]}
        position={[0, 0.48, 0]}
        color="#e8e5dc"
        radius={0.006}
      />
      <RoundedFurniturePanel
        name="caster-fork"
        size={[0.025, 0.05, 0.03]}
        position={[-0.3, 0.075, -0.175]}
        color="#606b70"
        radius={0.006}
      />
      <mesh
        name="wheel"
        position={[-0.3, 0.04, -0.175]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.04, 0.04, 0.025, 16]} />
        <ToonMaterial color="#606b70" />
      </mesh>
      <RoundedFurniturePanel
        name="caster-fork"
        size={[0.025, 0.05, 0.03]}
        position={[-0.3, 0.075, 0.175]}
        color="#606b70"
        radius={0.006}
      />
      <mesh
        name="wheel"
        position={[-0.3, 0.04, 0.175]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.04, 0.04, 0.025, 16]} />
        <ToonMaterial color="#606b70" />
      </mesh>
      <RoundedFurniturePanel
        name="caster-fork"
        size={[0.025, 0.05, 0.03]}
        position={[0.3, 0.075, -0.175]}
        color="#606b70"
        radius={0.006}
      />
      <mesh
        name="wheel"
        position={[0.3, 0.04, -0.175]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.04, 0.04, 0.025, 16]} />
        <ToonMaterial color="#606b70" />
      </mesh>
      <RoundedFurniturePanel
        name="caster-fork"
        size={[0.025, 0.05, 0.03]}
        position={[0.3, 0.075, 0.175]}
        color="#606b70"
        radius={0.006}
      />
      <mesh
        name="wheel"
        position={[0.3, 0.04, 0.175]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.04, 0.04, 0.025, 16]} />
        <ToonMaterial color="#606b70" />
      </mesh>
    </group>
  );
}
