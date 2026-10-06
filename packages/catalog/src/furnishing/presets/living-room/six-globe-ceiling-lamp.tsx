import { GlobeLampArm } from "./globe-lamp-arm";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const SIX_GLOBE_CEILING_LAMP_SIZE = [0.9, 0.42, 0.8062177826] as const;
/** Generic proportions inferred from reference appearance, not manufacturer measurements. */
export function SixGlobeCeilingLamp({
  size = SIX_GLOBE_CEILING_LAMP_SIZE,
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group
      name="six-globe-ceiling-lamp"
      scale={[size[0] / 0.9, size[1] / 0.42, size[2] / 0.8062177826]}
    >
      <mesh position={[0, 0.4075, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.025, 24]} />
        <ToonMaterial color="#ac9770" />
      </mesh>
      <mesh position={[0, 0.285, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.22, 16]} />
        <ToonMaterial color="#ac9770" />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.03, 24]} />
        <ToonMaterial color="#c4b089" />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * 0.35,
          z = Math.sin(angle) * 0.35;
        return (
          <group key={i}>
            <GlobeLampArm end={[x, 0.13, z]} />
            <mesh name="ceiling-lamp-globe" position={[x, 0.1, z]}>
              <sphereGeometry args={[0.1, 20, 12]} />
              <ToonMaterial color="#eeeee5" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
