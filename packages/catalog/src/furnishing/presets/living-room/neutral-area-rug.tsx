import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const NEUTRAL_AREA_RUG_SIZE = [2, .015, 3] as const;

type ColorfulRugVariant = "terracotta" | "sage" | "ocean" | "playful";
type RugBlock = readonly [
  x: number,
  z: number,
  width: number,
  depth: number,
  color: string,
];

const COLORFUL_RUG_VARIANTS: Readonly<Record<ColorfulRugVariant, {
  field: string;
  outline: string;
  border: string;
  blocks: readonly RugBlock[];
}>> = {
  terracotta: {
    field: "#dfcdb6",
    outline: "#8d5d49",
    border: "#a85f45",
    blocks: [
      [-.54, -.66, .34, .84, "#c97858"],
      [0, 0, .46, .62, "#9d5945"],
      [.54, .66, .34, .84, "#c97858"],
      [-.5, .78, .26, .3, "#eddcc6"],
      [.5, -.78, .26, .3, "#eddcc6"],
    ],
  },
  sage: {
    field: "#d7d5bd",
    outline: "#5f6c59",
    border: "#78866b",
    blocks: [
      [-.56, -.72, .42, .68, "#9baa8a"],
      [.28, -.78, .66, .3, "#b8bea1"],
      [-.22, .04, .7, .38, "#879677"],
      [.52, .52, .36, .86, "#a8b397"],
      [-.58, .82, .3, .4, "#eee5cf"],
    ],
  },
  ocean: {
    field: "#d5dedc",
    outline: "#476774",
    border: "#587d88",
    blocks: [
      [-.42, -1, .72, .24, "#7ea3aa"],
      [.4, -.58, .74, .24, "#9bb8ba"],
      [-.4, -.12, .74, .24, "#668c97"],
      [.4, .34, .74, .24, "#86a9ae"],
      [-.4, .8, .74, .24, "#527985"],
    ],
  },
  playful: {
    field: "#eadfc9",
    outline: "#705f56",
    border: "#94715f",
    blocks: [
      [-.55, -.86, .4, .48, "#cf7758"],
      [.02, -.9, .42, .32, "#dbad62"],
      [.58, -.62, .3, .7, "#6f9493"],
      [-.42, -.08, .62, .3, "#8fa27e"],
      [.32, .08, .46, .48, "#c58a76"],
      [-.58, .62, .28, .7, "#75939e"],
      [.18, .72, .72, .32, "#d4a554"],
    ],
  },
};

const isColorfulRugVariant = (variant: string): variant is ColorfulRugVariant =>
  Object.hasOwn(COLORFUL_RUG_VARIANTS, variant);

function NeutralRugLayers() {
  return <>
    <RoundedFurniturePanel name="area-rug-field" size={[2, .01, 3]}
      position={[0, .005, 0]} color="#d8cfbd" radius={.015} outlineColor="#9b907e" />
    {/* Border tops at 12 mm; bands top at 15 mm, avoiding coplanar faces. */}
    <mesh name="area-rug-border" position={[0, .011, 0]} receiveShadow>
      <boxGeometry args={[1.91, .002, 2.91]} /><ToonMaterial color="#c5b79f" />
    </mesh>
    {[-.54, 0, .54].map((x) => <mesh key={x} name="area-rug-band"
      position={[x, .013, 0]} receiveShadow>
      <boxGeometry args={[.05, .004, 2.76]} /><ToonMaterial color="#aaa48d" />
    </mesh>)}
  </>;
}

function ColorfulRugLayers({ variant }: { variant: ColorfulRugVariant }) {
  const style = COLORFUL_RUG_VARIANTS[variant];
  return <>
    {/* Field top is 13 mm. Every colored overlay is 2 mm thick and tops at 15 mm. */}
    <RoundedFurniturePanel name="area-rug-field" size={[2, .013, 3]}
      position={[0, .0065, 0]} color={style.field} radius={.015} outlineColor={style.outline} />
    {[-.945, .945].map((x) => <mesh key={`side-${x}`} name="area-rug-border-side"
      position={[x, .014, 0]} receiveShadow>
      <boxGeometry args={[.06, .002, 2.91]} /><ToonMaterial color={style.border} />
    </mesh>)}
    {[-1.425, 1.425].map((z) => <mesh key={`end-${z}`} name="area-rug-border-end"
      position={[0, .014, z]} receiveShadow>
      <boxGeometry args={[1.83, .002, .06]} /><ToonMaterial color={style.border} />
    </mesh>)}
    {style.blocks.map(([x, z, width, depth, color], index) => <mesh
      key={`${variant}-${index}`} name={`area-rug-${variant}-block`}
      position={[x, .014, z]} receiveShadow>
      <boxGeometry args={[width, .002, depth]} /><ToonMaterial color={color} />
    </mesh>)}
  </>;
}

/** Thin code-native rug with neutral and restrained colorful geometric variants. */
export function NeutralAreaRug({
  size = NEUTRAL_AREA_RUG_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return <group name="neutral-area-rug" scale={[size[0] / 2, size[1] / .015, size[2] / 3]}>
    {isColorfulRugVariant(variant)
      ? <ColorfulRugLayers variant={variant} />
      : <NeutralRugLayers />}
  </group>;
}
