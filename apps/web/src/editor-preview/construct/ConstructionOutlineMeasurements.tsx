import type { FloorCoordinates, Polygon } from "@cabane/engine";
import { ConstructionWallMeasurements } from "./ConstructionWallMeasurements";

/** Reuse wall junction measurements for the two edges meeting a dragged corner. */
export function ConstructionOutlineMeasurements({ polygon, corner, coordinates, labelKind }: {
  polygon: Polygon;
  corner: number | null;
  coordinates: FloorCoordinates;
  labelKind: string;
}) {
  const segments = polygon.map((from, index) => ({
    id: `outline-edge-${index}`, from, to: polygon[(index + 1) % polygon.length],
  }));
  const primary = segments[corner ?? 0];
  return <ConstructionWallMeasurements walls={segments} primary={primary}
    junctions={corner === null ? polygon : [polygon[corner]]}
    coordinates={coordinates} planMode defaultThicknessMeters={.055} labelKind={labelKind} />;
}
