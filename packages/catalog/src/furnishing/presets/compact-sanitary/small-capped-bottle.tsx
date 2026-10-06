import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const SMALL_CAPPED_BOTTLE_SIZE = [0.06, 0.19, 0.06] as const;
/** Generic clear toiletry bottle, with a physical neck and coloured screw cap; no branding. */
export function SmallCappedBottle({
  size = SMALL_CAPPED_BOTTLE_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const opaque = variant === "green" || variant === "opaque-white";
  const bodyColor = variant === "green" ? "#8baa58" : opaque ? "#eeeae0" : "#cedcd4";
  return (
    <group name="small-capped-bottle" scale={[size[0] / 0.06, size[1] / 0.19, size[2] / 0.06]}>
      <mesh name="capped-bottle-body" position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 24]} />
        <ToonMaterial
          color={bodyColor}
          transparent={!opaque}
          opacity={opaque ? 1 : 0.35}
          depthWrite={opaque}
        />
      </mesh>
      <mesh name="capped-bottle-shoulder" position={[0, 0.1325, 0]}>
        <cylinderGeometry args={[0.012, 0.03, 0.025, 24]} />
        <ToonMaterial
          color={bodyColor}
          transparent={!opaque}
          opacity={opaque ? 1 : 0.35}
          depthWrite={opaque}
        />
      </mesh>
      <mesh name="bottle-neck" position={[0, 0.1575, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.025, 24]} />
        <ToonMaterial
          color={bodyColor}
          transparent={!opaque}
          opacity={opaque ? 1 : 0.35}
          depthWrite={opaque}
        />
      </mesh>
      <mesh name="screw-cap" position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.02, 24]} />
        <ToonMaterial color={variant === "white" || opaque ? "#eeeae0" : "#b93640"} />
      </mesh>
    </group>
  );
}
