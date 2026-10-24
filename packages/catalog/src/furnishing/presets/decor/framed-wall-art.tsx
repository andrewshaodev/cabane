import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FRAMED_WALL_ART_SIZE = [0.8, 0.6, 0.04] as const;

/** Texture-free abstract wall art built from shallow earth and sage relief planes. */
export function FramedWallArt({
  size = FRAMED_WALL_ART_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group name="framed-wall-art" scale={[size[0] / 0.8, size[1] / 0.6, size[2] / 0.04]}>
      <RoundedFurniturePanel
        name="wall-art-backing"
        size={[0.8, 0.6, 0.025]}
        position={[0, 0.3, 0.0125]}
        color="#b88e5e"
        radius={0.01}
      />
      <RoundedFurniturePanel
        name="wall-art-canvas"
        size={[0.7, 0.5, 0.018]}
        position={[0, 0.3, 0.028]}
        color="#eee8da"
        radius={0.006}
        outline={false}
      />
      {variant !== "default" ? (
        <BotanicalPrint variant={variant} />
      ) : (
        <>
          <mesh name="wall-art-sun" position={[-0.17, 0.37, 0.039]}>
            <circleGeometry args={[0.105, 24]} />
            <ToonMaterial color="#c88762" />
          </mesh>
          <mesh name="wall-art-sage-plane" position={[0.16, 0.25, 0.039]} rotation={[0, 0, -0.2]}>
            <planeGeometry args={[0.26, 0.26]} />
            <ToonMaterial color="#8f9c86" />
          </mesh>
          <mesh name="wall-art-earth-plane" position={[0.04, 0.14, 0.04]} rotation={[0, 0, 0.12]}>
            <planeGeometry args={[0.48, 0.12]} />
            <ToonMaterial color="#b9a07c" />
          </mesh>
        </>
      )}
    </group>
  );
}

function BotanicalPrint({ variant }: { variant: string }) {
  const color = variant === "clay" ? "#b6785b" : variant === "fern" ? "#627451" : "#89966a";
  return (
    <group name="botanical-print">
      <mesh position={[0, 0.3, 0.04]}>
        <planeGeometry args={[0.008, 0.38]} />
        <ToonMaterial color={color} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) =>
        [-1, 1].map((side) => (
          <mesh
            key={i + ":" + side}
            position={[side * (0.075 - i * 0.006), 0.15 + i * 0.047, 0.04]}
            rotation={[0, 0, side * -0.55]}
            scale={[variant === "fern" ? 0.065 : 0.045, 0.022, 1]}
          >
            <circleGeometry args={[1, 12]} />
            <ToonMaterial color={color} />
          </mesh>
        )),
      )}
    </group>
  );
}
