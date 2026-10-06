import { Html } from "@react-three/drei";
import type { ManifestIssue, StairFlight } from "@cabane/engine";
import { ConstructionDistanceLabel } from "../editor-preview/construct/ConstructionDistanceLabel";

export function StairFeedback({ flight, issues, measurements = true }: {
  flight: StairFlight; issues: readonly ManifestIssue[]; measurements?: boolean;
}) {
  return <Html position={[flight.startWorld[0] - flight.forward[0] * .65, .3,
    flight.startWorld[1] - flight.forward[1] * .65]} center
    style={{ pointerEvents: "none", width: 250, textAlign: "center" }}>
    {measurements && <ConstructionDistanceLabel label={`${flight.runMeters.toFixed(2)} m × ${flight.widthMeters.toFixed(2)} m`} ariaLabel="Stair length and width" />}
    {issues.length > 0 && <div role="status" className="stair-placement-error">
      {Array.from(new Set(issues.map(issue => issue.message))).map(message => <div key={message}>{message}</div>)}
    </div>}
  </Html>;
}
