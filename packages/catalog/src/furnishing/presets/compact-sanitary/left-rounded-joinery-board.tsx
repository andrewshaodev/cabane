import { useMemo } from "react";
import { Shape } from "three";
import { ToonMaterial } from "@cabane/engine";
/** Board extruded upward, with a quarter-round front left corner and a wall-back origin. */
export function LeftRoundedJoineryBoard({
  width,
  height,
  depth,
  radius,
  bottom = 0,
  color,
  name,
}: {
  width: number;
  height: number;
  depth: number;
  radius: number;
  bottom?: number;
  color: string;
  name: string;
}) {
  const shape = useMemo(() => {
    const s = new Shape(),
      r = Math.min(radius, width, depth);
    s.moveTo(-width / 2, 0);
    s.lineTo(width / 2, 0);
    s.lineTo(width / 2, -depth);
    s.lineTo(-width / 2 + r, -depth);
    s.absarc(-width / 2 + r, -depth + r, r, -Math.PI / 2, -Math.PI, true);
    s.lineTo(-width / 2, 0);
    s.closePath();
    return s;
  }, [width, depth, radius]);
  return (
    <mesh
      name={name}
      position={[0, bottom, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      castShadow
      receiveShadow
    >
      <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false, curveSegments: 16 }]} />
      <ToonMaterial color={color} />
    </mesh>
  );
}
