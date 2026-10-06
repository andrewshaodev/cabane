import { Path, Shape, Vector2 } from "three";
import { ToonMaterial } from "@cabane/engine";
const rim = new Shape();
rim.moveTo(-0.3, -0.175);
rim.lineTo(0.3, -0.175);
rim.lineTo(0.3, 0.145);
rim.quadraticCurveTo(0.3, 0.175, 0.27, 0.175);
rim.lineTo(-0.27, 0.175);
rim.quadraticCurveTo(-0.3, 0.175, -0.3, 0.145);
rim.closePath();
const opening = new Path();
opening.absellipse(0, 0.025, 0.25, 0.115, 0, Math.PI * 2, true);
rim.holes.push(opening);
const profile = [
  [0.255, 0.478],
  [0.25, 0.475],
  [0.23, 0.44],
  [0.18, 0.375],
  [0.07, 0.36],
  [0, 0.36],
  [0, 0.345],
  [0.075, 0.345],
  [0.19, 0.363],
  [0.24, 0.433],
  [0.26, 0.478],
].map(([a, b]) => new Vector2(a, b));
/** Ceramic top with a genuine cutout and elliptical recessed bowl. */
export function IntegratedCompactBasin() {
  return (
    <group>
      <mesh name="basin-rim" position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[rim, { depth: 0.025, bevelEnabled: false, curveSegments: 20 }]} />
        <ToonMaterial color="#f0efea" />
      </mesh>
      <mesh name="basin-bowl" position={[0, 0, 0.025]} scale={[1, 1, 0.46]}>
        <latheGeometry args={[profile, 32]} />
        <ToonMaterial color="#eeede7" side={2} />
      </mesh>
      <mesh name="basin-drain" position={[0, 0.361, 0.025]}>
        <cylinderGeometry args={[0.015, 0.015, 0.002, 16]} />
        <ToonMaterial color="#a6aeab" />
      </mesh>
    </group>
  );
}
