import { useMemo } from "react";
import type { FloorCoordinates } from "../../types";
import type { StairFlight } from "../flight-geometry";
import { deriveStairGuardSegments } from "../guard-geometry";
import { StairStrokeSegments } from "./StairStrokeSegments";

export function ShapedStairGuards({
  flight,
  coordinates,
  upper = false,
}: {
  flight: StairFlight;
  coordinates: FloorCoordinates;
  upper?: boolean;
}) {
  const strokes = useMemo(
    () => deriveStairGuardSegments(flight, coordinates, upper),
    [flight, coordinates, upper],
  );
  return <StairStrokeSegments strokes={strokes} color="#736c61" />;
}
