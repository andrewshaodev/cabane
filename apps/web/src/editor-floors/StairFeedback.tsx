import { formatLength, useMeasurementUnits } from "@cabane/engine";
import { Html } from "@react-three/drei";
import type { StairFlight } from "@cabane/engine";
import { ConstructionDistanceLabel } from "../editor-preview/construct/ConstructionDistanceLabel";

export function StairFeedback({ flight }: { flight: StairFlight }) {
  const units = useMeasurementUnits();
  return (
    <Html
      position={[
        (Math.min(...flight.footprintWorld.map((p) => p[0])) +
          Math.max(...flight.footprintWorld.map((p) => p[0]))) /
          2,
        0.3,
        Math.max(...flight.footprintWorld.map((p) => p[1])) + 0.65,
      ]}
      center
      style={{ pointerEvents: "none", width: 250, textAlign: "center" }}
    >
      <ConstructionDistanceLabel
        label={
          flight.spec.shape === "spiral"
            ? `Ø ${formatLength(flight.spec.diameterMeters, units)} · ${flight.spec.totalTurnDegrees}°`
            : flight.spec.shape === "l-shaped" || flight.spec.shape === "u-shaped"
              ? `${formatLength(flight.spec.lowerRunMeters, units)} + ${formatLength(flight.spec.upperRunMeters, units)} × ${formatLength(flight.widthMeters, units)}`
              : `${formatLength(flight.runMeters, units)} × ${formatLength(flight.widthMeters, units)}`
        }
        ariaLabel="Stair length and width"
      />
    </Html>
  );
}
