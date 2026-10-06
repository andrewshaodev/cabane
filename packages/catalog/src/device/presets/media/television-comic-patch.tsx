import { useMemo } from "react";
import { Shape } from "three";
import { LayeredSurface } from "@cabane/engine";

/** Flat comic ink, with depth-buffer separation rather than physical screen protrusion. */
export function TelevisionComicPatch({
  points,
  color,
  layer,
}: {
  points: readonly (readonly [number, number])[];
  color: string;
  layer: number;
}) {
  const shape = useMemo(() => {
    const path = new Shape();
    points.forEach(([x, y], index) => (index ? path.lineTo(x, y) : path.moveTo(x, y)));
    path.closePath();
    return path;
  }, [points]);
  return (
    <LayeredSurface layer={layer} color={color} emissive={color} emissiveIntensity={0.85}>
      <shapeGeometry args={[shape]} />
    </LayeredSurface>
  );
}
