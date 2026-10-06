import { Outlines, ToonMaterial } from "@cabane/engine";

export type KitchenVector3 = readonly [number, number, number];

export const KITCHEN_CREAM = "#eee9de";
export const KITCHEN_CREAM_LIGHT = "#f5f2eb";
export const KITCHEN_STONE = "#eee8dc";
export const KITCHEN_STONE_VEIN = "#d3c9bc";
export const KITCHEN_OAK = "#b77b43";
export const KITCHEN_OAK_LIGHT = "#d09a62";
export const KITCHEN_BRASS = "#b78332";
export const KITCHEN_DARK = "#292b2a";
export const KITCHEN_OUTLINE = "#665c50";

export function KitchenBox({
  size,
  position,
  color,
  outline = KITCHEN_OUTLINE,
  receiveShadow = false,
}: {
  readonly size: KitchenVector3;
  readonly position: KitchenVector3;
  readonly color: string;
  readonly outline?: string;
  readonly receiveShadow?: boolean;
}) {
  return (
    <mesh position={position} castShadow receiveShadow={receiveShadow}>
      <boxGeometry args={[...size]} />
      <ToonMaterial color={color} />
      <Outlines thickness={0.006} color={outline} screenspace={false} />
    </mesh>
  );
}

export function KitchenPanel({
  width,
  height,
  position,
}: {
  readonly width: number;
  readonly height: number;
  readonly position: KitchenVector3;
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={[width, height, 0.018]} />
      <ToonMaterial color={KITCHEN_CREAM_LIGHT} />
    </mesh>
  );
}
