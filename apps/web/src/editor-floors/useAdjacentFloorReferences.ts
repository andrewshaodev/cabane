import { useMemo, useState } from "react";
import type { FloorSpec } from "@cabane/engine";

export type FloorReferenceDirection = "above" | "below";
const directions = ["above", "below"] as const;

/** One reference list drives controls, plan guides, and alignment snapping. */
export function useAdjacentFloorReferences(floors: readonly FloorSpec[], activeFloorId: string) {
  const [visibility, setVisibility] = useState({ above: true, below: true });
  const references = useMemo(() => {
    const index = floors.findIndex((floor) => floor.id === activeFloorId);
    if (index < 0) return [];
    return directions.flatMap((direction) => {
      const floor = floors[index + (direction === "above" ? 1 : -1)];
      return floor ? [{ direction, floor, visible: visibility[direction] }] : [];
    });
  }, [floors, activeFloorId, visibility]);
  const referenceWalls = useMemo(
    () => references.flatMap((reference) => (reference.visible ? reference.floor.walls : [])),
    [references],
  );
  const setVisible = (direction: FloorReferenceDirection, visible: boolean) => {
    setVisibility((current) => ({ ...current, [direction]: visible }));
  };
  return { references, referenceWalls, setVisible };
}
