import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const GARDEN_HOSE_REEL_SIZE = [0.48, 0.6, 0.42] as const;

export function GardenHoseReel({ size = GARDEN_HOSE_REEL_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="garden-hose-reel"
      scale={[size[0] / 0.48, size[1] / 0.6, size[2] / 0.42]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="foot"
        size={[0.48, 0.04, 0.4]}
        position={[0, 0.02, 0]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="upright"
        size={[0.035, 0.43, 0.035]}
        position={[-0.2, 0.245, 0]}
        color="#414e49"
      />
      <RoundedFurniturePanel
        name="upright"
        size={[0.035, 0.43, 0.035]}
        position={[0.2, 0.245, 0]}
        color="#414e49"
      />
      <mesh
        name="spool"
        position={[0, 0.39, 0]}
        rotation={[0, 0, 1.5707963267948966]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.16, 0.16, 0.32, 24]} />
        <ToonMaterial color="#6d8063" />
      </mesh>
      <mesh
        name="reel-flange"
        position={[-0.1725, 0.39, 0]}
        rotation={[0, 0, 1.5707963267948966]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.21, 0.21, 0.025, 24]} />
        <ToonMaterial color="#414e49" />
      </mesh>
      <mesh
        name="reel-flange"
        position={[0.1725, 0.39, 0]}
        rotation={[0, 0, 1.5707963267948966]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.21, 0.21, 0.025, 24]} />
        <ToonMaterial color="#414e49" />
      </mesh>
      <RoundedFurniturePanel
        name="crank"
        size={[0.035, 0.12, 0.035]}
        position={[0.215, 0.39, 0.04]}
        color="#b58a58"
      />
      <RoundedFurniturePanel
        name="axle"
        size={[0.1, 0.025, 0.025]}
        position={[0.19, 0.44, 0]}
        color="#414e49"
      />
      <mesh
        name="hose-coil"
        position={[-0.12, 0.39, 0]}
        rotation={[0, 1.5707963267948966, 0]}
        castShadow
      >
        <torusGeometry args={[0.16, 0.012, 8, 24]} />
        <ToonMaterial color="#6d8063" />
      </mesh>
      <mesh
        name="hose-coil"
        position={[-0.08, 0.39, 0]}
        rotation={[0, 1.5707963267948966, 0]}
        castShadow
      >
        <torusGeometry args={[0.16, 0.012, 8, 24]} />
        <ToonMaterial color="#6d8063" />
      </mesh>
      <mesh
        name="hose-coil"
        position={[-0.04, 0.39, 0]}
        rotation={[0, 1.5707963267948966, 0]}
        castShadow
      >
        <torusGeometry args={[0.16, 0.012, 8, 24]} />
        <ToonMaterial color="#6d8063" />
      </mesh>
      <mesh
        name="hose-coil"
        position={[0, 0.39, 0]}
        rotation={[0, 1.5707963267948966, 0]}
        castShadow
      >
        <torusGeometry args={[0.16, 0.012, 8, 24]} />
        <ToonMaterial color="#6d8063" />
      </mesh>
      <mesh
        name="hose-coil"
        position={[0.04, 0.39, 0]}
        rotation={[0, 1.5707963267948966, 0]}
        castShadow
      >
        <torusGeometry args={[0.16, 0.012, 8, 24]} />
        <ToonMaterial color="#6d8063" />
      </mesh>
      <mesh
        name="hose-coil"
        position={[0.08, 0.39, 0]}
        rotation={[0, 1.5707963267948966, 0]}
        castShadow
      >
        <torusGeometry args={[0.16, 0.012, 8, 24]} />
        <ToonMaterial color="#6d8063" />
      </mesh>
      <mesh
        name="hose-coil"
        position={[0.12, 0.39, 0]}
        rotation={[0, 1.5707963267948966, 0]}
        castShadow
      >
        <torusGeometry args={[0.16, 0.012, 8, 24]} />
        <ToonMaterial color="#6d8063" />
      </mesh>
    </group>
  );
}
