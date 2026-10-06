import { Shape } from "three";
import { ToonMaterial } from "@cabane/engine";
const half = new Shape();
half.moveTo(0, -0.022);
half.absarc(0, 0, 0.022, -Math.PI / 2, Math.PI / 2, false);
half.lineTo(0, -0.022);
half.closePath();
/** Two brass half-circle pulls meeting at the cabinet's centre seam. */
export function CabinetMeetingPulls({
  height = 0.033,
  color = "#bfa068",
}: {
  height?: number;
  color?: string;
}) {
  return (
    <group position={[0, height, 0.248]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.002, 0, 0]} scale={[side, 1, 1]}>
          <extrudeGeometry
            args={[half, { depth: 0.027, bevelEnabled: false, curveSegments: 16 }]}
          />
          <ToonMaterial color={color} side={2} />
        </mesh>
      ))}
    </group>
  );
}
