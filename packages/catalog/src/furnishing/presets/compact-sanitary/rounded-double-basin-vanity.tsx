import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { LeftRoundedJoineryBoard } from "./left-rounded-joinery-board";
export const ROUNDED_DOUBLE_BASIN_VANITY_SIZE = [1.2, 0.42, 0.5] as const;
/** Two side-by-side drawer fronts, a rounded left return and a separate white worktop; bowls are separate items. */
export function RoundedDoubleBasinVanity({
  size = ROUNDED_DOUBLE_BASIN_VANITY_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group
      name="rounded-double-basin-vanity"
      scale={[
        ((variant === "round-right" ? -1 : 1) * size[0]) / 1.2,
        size[1] / 0.42,
        size[2] / 0.5,
      ]}
      userData={{ walkCollider: true }}
    >
      <LeftRoundedJoineryBoard
        name="vanity-bottom"
        width={1.2}
        height={0.02}
        depth={0.5}
        radius={0.15}
        color="#aa784b"
      />
      <group position={[-0.525, 0, 0]}>
        <LeftRoundedJoineryBoard
          name="rounded-left-return"
          width={0.15}
          height={0.38}
          depth={0.5}
          radius={0.15}
          bottom={0.02}
          color="#aa784b"
        />
      </group>
      <mesh name="vanity-back" position={[0, 0.21, 0.01]}>
        <boxGeometry args={[1.2, 0.38, 0.02]} />
        <ToonMaterial color="#aa784b" />
      </mesh>
      <mesh name="vanity-right-support" position={[0.59, 0.21, 0.24]}>
        <boxGeometry args={[0.02, 0.38, 0.48]} />
        <ToonMaterial color="#aa784b" />
      </mesh>
      {[-0.1875, 0.3375].map((x) => (
        <group key={x}>
          <mesh
            name="side-by-side-drawer-front"
            position={[x, 0.2075, 0.49]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.522, 0.371, 0.02]} />
            <ToonMaterial color="#b28255" />
          </mesh>
          <mesh name="recessed-top-grip" position={[x, 0.3975, 0.478]}>
            <boxGeometry args={[0.522, 0.005, 0.014]} />
            <ToonMaterial color="#795435" />
          </mesh>
        </group>
      ))}
      <LeftRoundedJoineryBoard
        name="white-rounded-worktop"
        width={1.2}
        height={0.02}
        depth={0.5}
        radius={0.15}
        bottom={0.4}
        color="#f0eee6"
      />
    </group>
  );
}
