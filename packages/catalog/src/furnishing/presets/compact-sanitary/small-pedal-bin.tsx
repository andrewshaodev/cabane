import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const SMALL_PEDAL_BIN_SIZE = [0.2, 0.32, 0.235] as const;
/** Generic small cylindrical bathroom bin with a supported lid and connected front pedal. */
export function SmallPedalBin({ size = SMALL_PEDAL_BIN_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="small-pedal-bin"
      scale={[size[0] / 0.2, size[1] / 0.32, size[2] / 0.235]}
      userData={{ walkCollider: true }}
    >
      <mesh name="pedal-bin-body" position={[0, 0.15, -0.0175]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 28]} />
        <ToonMaterial color="#ced0c9" />
      </mesh>
      <mesh name="pedal-bin-lid" position={[0, 0.314, -0.0175]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.012, 28]} />
        <ToonMaterial color="#e5e4de" />
      </mesh>
      <mesh name="pedal-bin-hinge" position={[0, 0.301, -0.108]}>
        <boxGeometry args={[0.022, 0.025, 0.015]} />
        <ToonMaterial color="#7c827e" />
      </mesh>
      <mesh name="bin-foot-pedal" position={[0, 0.018, 0.0975]}>
        <boxGeometry args={[0.08, 0.015, 0.04]} />
        <ToonMaterial color="#454c47" />
      </mesh>
    </group>
  );
}
