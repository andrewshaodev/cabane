import { ToonMaterial } from "@cabane/engine";
import { BrassCabinetHandle } from "./brass-cabinet-handle";
import { CabinetJoint } from "./cabinet-joint";
import {
  KITCHEN_CREAM,
  KITCHEN_CREAM_LIGHT,
  KITCHEN_STONE,
  KitchenBox,
  KitchenPanel,
} from "./kitchen-finish";
import { StoneVein } from "./stone-vein";

export const KITCHEN_CEILING_MOUNT_OFFSET = 0.55;
const UPPER_CABINET_HEIGHT = 0.66;
const UPPER_CABINET_CENTER_Y = 1.35 + KITCHEN_CEILING_MOUNT_OFFSET;
const UPPER_CABINET_BOTTOM_Y = UPPER_CABINET_CENTER_Y - UPPER_CABINET_HEIGHT / 2;
const UPPER_CABINET_TOP_Y = UPPER_CABINET_BOTTOM_Y + UPPER_CABINET_HEIGHT;
export const UNDER_CABINET_STRIP_Y = UPPER_CABINET_BOTTOM_Y - 0.015;

const TALL_PANTRY_HEIGHT = UPPER_CABINET_TOP_Y;
const TALL_PANTRY_VERTICAL_SCALE = TALL_PANTRY_HEIGHT / 1.65;

const baseCabinets = [
  { center: 1.09, width: 0.58, kind: "oven" },
  { center: 1.71, width: 0.66, kind: "door" },
  { center: 2.37, width: 0.66, kind: "door" },
  { center: 3.03, width: 0.66, kind: "door" },
  { center: 3.535, width: 0.35, kind: "door" },
] as const;

export const upperCabinets = [
  { center: 1.115, width: 0.67, kind: "solid" },
  { center: 1.64, width: 0.38, kind: "solid" },
  { center: 2.11, width: 0.56, kind: "microwave" },
  { center: 2.56, width: 0.34, kind: "glass", handleSide: 1 },
  { center: 2.9, width: 0.34, kind: "glass", handleSide: -1 },
  { center: 3.2, width: 0.26, kind: "glass", handleSide: 1 },
  { center: 3.46, width: 0.26, kind: "glass", handleSide: -1 },
  { center: 3.705, width: 0.23, kind: "solid" },
] as const;

function TallPantry() {
  return (
    <group name="colonne-garde-manger" position={[0.42, 0, 0.3]}>
      <KitchenBox
        size={[0.72, TALL_PANTRY_HEIGHT, 0.54]}
        position={[0, TALL_PANTRY_HEIGHT / 2, 0]}
        color={KITCHEN_CREAM}
      />
      <KitchenPanel
        width={0.68}
        height={TALL_PANTRY_HEIGHT - 0.07}
        position={[0, TALL_PANTRY_HEIGHT / 2, 0.28]}
      />
      <CabinetJoint
        from={[-0.34, 1.04 * TALL_PANTRY_VERTICAL_SCALE, 0.291]}
        to={[0.34, 1.04 * TALL_PANTRY_VERTICAL_SCALE, 0.291]}
        color="#a69e93"
      />
      <BrassCabinetHandle position={[0.25, 1.32 * TALL_PANTRY_VERTICAL_SCALE, 0.335]} vertical />
      <BrassCabinetHandle position={[0.25, 0.68 * TALL_PANTRY_VERTICAL_SCALE, 0.335]} vertical />
    </group>
  );
}

function GlazedUpperDoor({
  width,
  position,
}: {
  readonly width: number;
  readonly position: readonly [number, number, number];
}) {
  const height = 0.64;
  const frame = 0.028;

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.016]}>
        <boxGeometry args={[width - 0.035, height - 0.035, 0.018]} />
        <ToonMaterial color="#69685f" />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <boxGeometry args={[width - 0.045, height - 0.045, 0.008]} />
        <ToonMaterial color="#c9cfca" transparent opacity={0.24} depthWrite={false} side={2} />
      </mesh>
      {[-1, 1].map((side) => (
        <KitchenBox
          key={`vertical-${side}`}
          size={[frame, height, 0.026]}
          position={[side * (width / 2 - frame / 2), 0, 0.018]}
          color={KITCHEN_CREAM_LIGHT}
          outline="#a49c90"
        />
      ))}
      {[-1, 1].map((side) => (
        <KitchenBox
          key={`edge-${side}`}
          size={[width, frame, 0.026]}
          position={[0, side * (height / 2 - frame / 2), 0.018]}
          color={KITCHEN_CREAM_LIGHT}
          outline="#a49c90"
        />
      ))}
      <KitchenBox
        size={[frame * 0.8, height - frame * 2, 0.024]}
        position={[0, 0, 0.02]}
        color={KITCHEN_CREAM_LIGHT}
        outline="#a49c90"
      />
      {[-1, 1].map((row) => (
        <KitchenBox
          key={`row-${row}`}
          size={[width - frame * 2, frame * 0.8, 0.024]}
          position={[0, row * (height / 6), 0.02]}
          color={KITCHEN_CREAM_LIGHT}
          outline="#a49c90"
        />
      ))}
    </group>
  );
}

function BaseDoor({ center, width }: { readonly center: number; readonly width: number }) {
  return (
    <group position={[center, 0, 0.31]}>
      <KitchenPanel width={width} height={0.78} position={[0, 0.415, 0.291]} />
      <CabinetJoint
        from={[-width / 2, 0.63, 0.304]}
        to={[width / 2, 0.63, 0.304]}
        color="#aaa298"
      />
      <BrassCabinetHandle position={[0, 0.7, 0.335]} />
    </group>
  );
}

function UpperDoor({ cabinet }: { readonly cabinet: (typeof upperCabinets)[number] }) {
  if (cabinet.kind === "microwave") return null;
  if (cabinet.kind === "glass") {
    return (
      <group position={[cabinet.center, KITCHEN_CEILING_MOUNT_OFFSET, 0.25]}>
        <GlazedUpperDoor width={cabinet.width} position={[0, 1.35, 0.235]} />
        <BrassCabinetHandle
          position={[cabinet.handleSide * (cabinet.width / 2 - 0.055), 1.13, 0.285]}
          vertical
        />
      </group>
    );
  }
  return (
    <group position={[cabinet.center, KITCHEN_CEILING_MOUNT_OFFSET, 0.25]}>
      <KitchenPanel width={cabinet.width} height={0.64} position={[0, 1.35, 0.211]} />
      <BrassCabinetHandle
        position={[(cabinet.center < 2.8 ? 1 : -1) * (cabinet.width / 2 - 0.055), 1.13, 0.255]}
        vertical
      />
    </group>
  );
}

export function KitchenCabinetry() {
  return (
    <group name="custom-kitchen-cabinetry">
      <TallPantry />
      <KitchenBox size={[2.93, 0.79, 0.56]} position={[2.245, 0.415, 0.31]} color={KITCHEN_CREAM} />
      {baseCabinets
        .filter((cabinet) => cabinet.kind === "door")
        .map((cabinet) => (
          <BaseDoor key={cabinet.center} center={cabinet.center} width={cabinet.width} />
        ))}
      {[1.38, 2.04, 2.7, 3.36].map((jointX) => (
        <CabinetJoint
          key={jointX}
          from={[jointX, 0.035, 0.614]}
          to={[jointX, 0.805, 0.614]}
          color="#aaa298"
        />
      ))}
      <KitchenBox
        size={[3.04, UPPER_CABINET_HEIGHT, 0.4]}
        position={[2.3, UPPER_CABINET_CENTER_Y, 0.25]}
        color={KITCHEN_CREAM}
      />
      {upperCabinets.map((cabinet) => (
        <UpperDoor key={cabinet.center} cabinet={cabinet} />
      ))}
      {[1.45, 1.83, 2.39, 2.73, 3.07, 3.33, 3.59].map((jointX) => (
        <CabinetJoint
          key={jointX}
          from={[jointX, 1.03 + KITCHEN_CEILING_MOUNT_OFFSET, 0.474]}
          to={[jointX, 1.67 + KITCHEN_CEILING_MOUNT_OFFSET, 0.474]}
          color="#aaa298"
        />
      ))}
      <KitchenBox
        size={[2.98, 0.085, 0.64]}
        position={[2.27, 0.875, 0.33]}
        color={KITCHEN_STONE}
        outline="#81776b"
        receiveShadow
      />
      <KitchenBox
        size={[2.98, 0.19, 0.035]}
        position={[2.27, 1.005, 0.035]}
        color={KITCHEN_STONE}
        outline="#94897d"
      />
      <StoneVein
        points={[
          [1.43, 0.923, 0.08],
          [1.57, 0.925, 0.17],
          [1.7, 0.924, 0.31],
          [1.91, 0.927, 0.4],
          [2.1, 0.926, 0.56],
        ]}
        width={0.007}
      />
      <StoneVein
        points={[
          [2.86, 0.925, 0.09],
          [3.01, 0.927, 0.17],
          [3.09, 0.924, 0.31],
          [3.3, 0.927, 0.38],
          [3.5, 0.926, 0.52],
        ]}
        width={0.006}
      />
    </group>
  );
}
