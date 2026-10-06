import { Html } from "@react-three/drei";
import type { ManifestIssue, StairFlight } from "@cabane/engine";
import { ConstructionDistanceLabel } from "../editor-preview/construct/ConstructionDistanceLabel";

export function StairFeedback({ flight, issues, measurements = true }: {
  flight: StairFlight; issues: readonly ManifestIssue[]; measurements?: boolean;
}) {
  return <Html position={[(Math.min(...flight.footprintWorld.map(p=>p[0]))+Math.max(...flight.footprintWorld.map(p=>p[0])))/2, .3,
    Math.max(...flight.footprintWorld.map(p=>p[1]))+.65]} center
    style={{ pointerEvents: "none", width: 250, textAlign: "center" }}>
    {measurements && <ConstructionDistanceLabel label={flight.spec.shape === "spiral" ? `Ø ${flight.spec.diameterMeters.toFixed(2)} m · ${flight.spec.totalTurnDegrees}°`
      : flight.spec.shape === "l-shaped" ? `${flight.spec.lowerRunMeters.toFixed(2)} + ${flight.spec.upperRunMeters.toFixed(2)} m × ${flight.widthMeters.toFixed(2)} m`
      : `${flight.runMeters.toFixed(2)} m × ${flight.widthMeters.toFixed(2)} m`} ariaLabel="Stair length and width" />}
    {issues.length > 0 && <div role="status" className="stair-placement-error">
      {Array.from(new Set(issues.map(issue => issue.message))).map(message => <div key={message}>{message}</div>)}
    </div>}
  </Html>;
}
