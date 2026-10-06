import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const TUBULAR_WALL_LAMP_SIZE = [0.07, 0.32, 0.12] as const;
/** Generic opal tube on a brushed metal base; a static visual with no inferred connected capability. */
export function TubularWallLamp({ size = TUBULAR_WALL_LAMP_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="tubular-wall-lamp" scale={[size[0] / 0.07, size[1] / 0.32, size[2] / 0.12]}>
      <mesh name="lamp-wall-plate" position={[0, 0.03, 0.01]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <ToonMaterial color="#929b98" />
      </mesh>
      <mesh name="lamp-standoff" position={[0, 0.03, 0.0525]}>
        <boxGeometry args={[0.02, 0.02, 0.07]} />
        <ToonMaterial color="#929b98" />
      </mesh>
      <mesh name="tube-metal-base" position={[0, 0.0325, 0.085]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.065, 24]} />
        <ToonMaterial color="#929b98" />
      </mesh>
      <mesh name="opal-tube" position={[0, 0.1925, 0.085]} castShadow>
        <capsuleGeometry args={[0.03, 0.195, 4, 24]} />
        <ToonMaterial color="#f8f2db" />
      </mesh>
    </group>
  );
}
