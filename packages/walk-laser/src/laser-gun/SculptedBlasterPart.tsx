import { useEffect, useMemo } from "react";
import { ExtrudeGeometry } from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { BlasterFinish } from "./BlasterFinish";
import { blasterContours } from "./blaster-contours";

/** Soft beveled side profiles, extruded across the blaster instead of stacked boxes. */
export function SculptedBlasterPart({
  contour,
  depth,
  bevel,
  finish,
  x = 0,
}: {
  contour: keyof typeof blasterContours;
  depth: number;
  bevel: number;
  finish: Parameters<typeof BlasterFinish>[0]["kind"];
  x?: number;
}) {
  const geometry = useMemo(() => {
    const source = new ExtrudeGeometry(blasterContours[contour], {
      depth,
      steps: 1,
      curveSegments: 16,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 6,
    });
    source.translate(0, 0, -depth / 2);
    // Weld before averaging so the broad rolled edges shade continuously.
    source.deleteAttribute("normal");
    source.deleteAttribute("uv");
    const result = mergeVertices(source, 0.00001);
    result.computeVertexNormals();
    source.dispose();
    return result;
  }, [contour, depth, bevel]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      name={`blaster-${contour}`}
      geometry={geometry}
      position={[x, 0, 0]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <BlasterFinish kind={finish} />
    </mesh>
  );
}
