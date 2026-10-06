import { Html } from "@react-three/drei";
import type { StairFlight } from "@cabane/engine";
import { ConstructionDistanceLabel } from "../editor-preview/construct/ConstructionDistanceLabel";

export function StairFeedback({ flight }: { flight: StairFlight }) {
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
            ? `Ø ${flight.spec.diameterMeters.toFixed(2)} m · ${flight.spec.totalTurnDegrees}°`
            : flight.spec.shape === "l-shaped" || flight.spec.shape === "u-shaped"
              ? `${flight.spec.lowerRunMeters.toFixed(2)} + ${flight.spec.upperRunMeters.toFixed(2)} m × ${flight.widthMeters.toFixed(2)} m`
              : `${flight.runMeters.toFixed(2)} m × ${flight.widthMeters.toFixed(2)} m`
        }
        ariaLabel="Stair length and width"
      />
    </Html>
  );
}
