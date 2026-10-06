import type { EditorWall, FloorCoordinates, PlanPoint } from "@cabane/engine";
import { useMemo } from "react";
import { ConstructionAngleGuide } from "./ConstructionAngleGuide";
import { ConstructionWallGuide } from "./ConstructionWallGuide";
import { wallConnectionMeasurements } from "./wall-connection-measurements";

export function ConstructionWallMeasurements({
  walls,
  primary,
  junctions,
  coordinates,
  planMode,
  defaultThicknessMeters,
  labelKind = "Wall",
}: {
  walls: readonly EditorWall[];
  primary: Parameters<typeof wallConnectionMeasurements>[0]["primary"];
  junctions: readonly PlanPoint[];
  coordinates: FloorCoordinates;
  planMode: boolean;
  defaultThicknessMeters: number;
  labelKind?: string;
}) {
  const measurements = useMemo(
    () => wallConnectionMeasurements({ walls, primary, junctions, coordinates }),
    [walls, primary, junctions, coordinates],
  );
  return (
    <group name="construction-wall-measurements">
      {measurements.lengths.map((wall) => (
        <ConstructionWallGuide
          key={wall.key}
          name={wall.primary ? "construction-wall-guide" : `construction-wall-guide-${wall.id}`}
          labelKind={labelKind}
          wallId={wall.id}
          from={wall.from}
          to={wall.to}
          coordinates={coordinates}
          planMode={planMode}
          showMarkers={wall.primary && primary.id === undefined}
          labelAvoidPoint={wall.avoidPoint}
          wallThicknessMeters={wall.thicknessMeters ?? defaultThicknessMeters}
        />
      ))}
      {measurements.angles.map((angle) => (
        <ConstructionAngleGuide
          key={angle.key}
          labelKind={labelKind}
          angle={angle}
          coordinates={coordinates}
          planMode={planMode}
        />
      ))}
    </group>
  );
}
