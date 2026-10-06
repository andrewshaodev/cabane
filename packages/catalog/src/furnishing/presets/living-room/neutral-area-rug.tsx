import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const NEUTRAL_AREA_RUG_SIZE = [2, 0.015, 3] as const;

type ColorfulRugVariant = "terracotta" | "sage" | "ocean" | "playful";
type RugBlock = readonly [x: number, z: number, width: number, depth: number, color: string];

const COLORFUL_RUG_VARIANTS: Readonly<
  Record<
    ColorfulRugVariant,
    {
      field: string;
      outline: string;
      border: string;
      blocks: readonly RugBlock[];
    }
  >
> = {
  terracotta: {
    field: "#dfcdb6",
    outline: "#8d5d49",
    border: "#a85f45",
    blocks: [
      [-0.54, -0.66, 0.34, 0.84, "#c97858"],
      [0, 0, 0.46, 0.62, "#9d5945"],
      [0.54, 0.66, 0.34, 0.84, "#c97858"],
      [-0.5, 0.78, 0.26, 0.3, "#eddcc6"],
      [0.5, -0.78, 0.26, 0.3, "#eddcc6"],
    ],
  },
  sage: {
    field: "#d7d5bd",
    outline: "#5f6c59",
    border: "#78866b",
    blocks: [
      [-0.56, -0.72, 0.42, 0.68, "#9baa8a"],
      [0.28, -0.78, 0.66, 0.3, "#b8bea1"],
      [-0.22, 0.04, 0.7, 0.38, "#879677"],
      [0.52, 0.52, 0.36, 0.86, "#a8b397"],
      [-0.58, 0.82, 0.3, 0.4, "#eee5cf"],
    ],
  },
  ocean: {
    field: "#d5dedc",
    outline: "#476774",
    border: "#587d88",
    blocks: [
      [-0.42, -1, 0.72, 0.24, "#7ea3aa"],
      [0.4, -0.58, 0.74, 0.24, "#9bb8ba"],
      [-0.4, -0.12, 0.74, 0.24, "#668c97"],
      [0.4, 0.34, 0.74, 0.24, "#86a9ae"],
      [-0.4, 0.8, 0.74, 0.24, "#527985"],
    ],
  },
  playful: {
    field: "#eadfc9",
    outline: "#705f56",
    border: "#94715f",
    blocks: [
      [-0.55, -0.86, 0.4, 0.48, "#cf7758"],
      [0.02, -0.9, 0.42, 0.32, "#dbad62"],
      [0.58, -0.62, 0.3, 0.7, "#6f9493"],
      [-0.42, -0.08, 0.62, 0.3, "#8fa27e"],
      [0.32, 0.08, 0.46, 0.48, "#c58a76"],
      [-0.58, 0.62, 0.28, 0.7, "#75939e"],
      [0.18, 0.72, 0.72, 0.32, "#d4a554"],
    ],
  },
};

const isColorfulRugVariant = (variant: string): variant is ColorfulRugVariant =>
  Object.hasOwn(COLORFUL_RUG_VARIANTS, variant);

function NeutralRugLayers() {
  return (
    <>
      <RoundedFurniturePanel
        name="area-rug-field"
        size={[2, 0.01, 3]}
        position={[0, 0.005, 0]}
        color="#d8cfbd"
        radius={0.015}
        outlineColor="#9b907e"
      />
      {/* Border tops at 12 mm; bands top at 15 mm, avoiding coplanar faces. */}
      <mesh name="area-rug-border" position={[0, 0.011, 0]} receiveShadow>
        <boxGeometry args={[1.91, 0.002, 2.91]} />
        <ToonMaterial color="#c5b79f" />
      </mesh>
      {[-0.54, 0, 0.54].map((x) => (
        <mesh key={x} name="area-rug-band" position={[x, 0.013, 0]} receiveShadow>
          <boxGeometry args={[0.05, 0.004, 2.76]} />
          <ToonMaterial color="#aaa48d" />
        </mesh>
      ))}
    </>
  );
}

function ColorfulRugLayers({ variant }: { variant: ColorfulRugVariant }) {
  const style = COLORFUL_RUG_VARIANTS[variant];
  return (
    <>
      {/* Field top is 13 mm. Every colored overlay is 2 mm thick and tops at 15 mm. */}
      <RoundedFurniturePanel
        name="area-rug-field"
        size={[2, 0.013, 3]}
        position={[0, 0.0065, 0]}
        color={style.field}
        radius={0.015}
        outlineColor={style.outline}
      />
      {[-0.945, 0.945].map((x) => (
        <mesh key={`side-${x}`} name="area-rug-border-side" position={[x, 0.014, 0]} receiveShadow>
          <boxGeometry args={[0.06, 0.002, 2.91]} />
          <ToonMaterial color={style.border} />
        </mesh>
      ))}
      {[-1.425, 1.425].map((z) => (
        <mesh key={`end-${z}`} name="area-rug-border-end" position={[0, 0.014, z]} receiveShadow>
          <boxGeometry args={[1.83, 0.002, 0.06]} />
          <ToonMaterial color={style.border} />
        </mesh>
      ))}
      {style.blocks.map(([x, z, width, depth, color], index) => (
        <mesh
          key={`${variant}-${index}`}
          name={`area-rug-${variant}-block`}
          position={[x, 0.014, z]}
          receiveShadow
        >
          <boxGeometry args={[width, 0.002, depth]} />
          <ToonMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

/** Thin code-native rug with neutral and restrained colorful geometric variants. */
export function NeutralAreaRug({
  size = NEUTRAL_AREA_RUG_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group name="neutral-area-rug" scale={[size[0] / 2, size[1] / 0.015, size[2] / 3]}>
      {isColorfulRugVariant(variant) ? (
        <ColorfulRugLayers variant={variant} />
      ) : (
        <NeutralRugLayers />
      )}
    </group>
  );
}
