import { Path, Shape } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const THIN_ARCHED_MIRROR_SIZE = [0.5, 0.8, 0.018] as const;
function outline(inset: number) {
  const s = new Shape(),
    radius = 0.25 - inset;
  s.moveTo(-radius, inset);
  s.lineTo(radius, inset);
  s.lineTo(radius, 0.55);
  s.absarc(0, 0.55, radius, 0, Math.PI, false);
  s.lineTo(-radius, inset);
  s.closePath();
  return s;
}
const frame = outline(0),
  inside = outline(0.006);
frame.holes.push(new Path(inside.getPoints(24)));
/** Thin metal arch surrounding a recessed toon mirror; no photo/environment texture. */
export function ThinArchedMirror({
  size = THIN_ARCHED_MIRROR_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group name="thin-arched-mirror" scale={[size[0] / 0.5, size[1] / 0.8, size[2] / 0.018]}>
      <mesh name="mirror-frame">
        <extrudeGeometry args={[frame, { depth: 0.018, bevelEnabled: false, curveSegments: 24 }]} />
        <ToonMaterial color={variant === "brass" ? "#bfa26c" : "#303936"} />
      </mesh>
      <mesh name="mirror-face" position={[0, 0, 0.002]}>
        <extrudeGeometry
          args={[inside, { depth: 0.014, bevelEnabled: false, curveSegments: 24 }]}
        />
        <ToonMaterial color="#becfcd" />
      </mesh>
    </group>
  );
}
