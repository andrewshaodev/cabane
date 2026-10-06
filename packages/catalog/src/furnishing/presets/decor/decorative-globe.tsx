import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const DECORATIVE_GLOBE_SIZE = [0.278, 0.339, 0.24] as const;
export function DecorativeGlobe({ size = DECORATIVE_GLOBE_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="decorative-globe" scale={[size[0] / 0.278, size[1] / 0.339, size[2] / 0.24]}>
      <mesh position={[0, 0.006, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.012, 24]} />
        <ToonMaterial color="#b39d70" />
      </mesh>
      <mesh position={[0, 0.046, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.074, 12]} />
        <ToonMaterial color="#b39d70" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.12, 24, 16]} />
        <ToonMaterial color="#e5e5da" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.135, 0.004, 6, 36]} />
        <ToonMaterial color="#a79570" />
      </mesh>
    </group>
  );
}
