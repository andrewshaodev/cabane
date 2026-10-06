import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const CONCEALED_SHOWER_MIXER_SIZE = [0.12, 0.2, 0.058] as const;
/** Generic inox two-outlet concealed control plate; water controls are static visuals. */
export function ConcealedShowerMixer({
  size = CONCEALED_SHOWER_MIXER_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group name="concealed-shower-mixer" scale={[size[0] / 0.12, size[1] / 0.2, size[2] / 0.058]}>
      <mesh name="concealed-mixer-plate" position={[0, 0.1, 0.004]}>
        <boxGeometry args={[0.12, 0.2, 0.008]} />
        <ToonMaterial color="#969f9c" />
      </mesh>
      <mesh name="shower-mixer-knob" position={[0, 0.12, 0.0255]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.035, 24]} />
        <ToonMaterial color="#929c98" />
      </mesh>
      <mesh name="shower-mixer-lever" position={[0, 0.135, 0.0505]}>
        <boxGeometry args={[0.014, 0.075, 0.015]} />
        <ToonMaterial color="#929c98" />
      </mesh>
      <mesh
        name="shower-outlet-selector"
        position={[0, 0.045, 0.0195]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.017, 0.017, 0.023, 24]} />
        <ToonMaterial color="#929c98" />
      </mesh>
    </group>
  );
}
