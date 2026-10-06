import { useEffect, useMemo } from "react";
import { CatmullRomCurve3, TubeGeometry, Vector3 } from "three";
import { ToonMaterial } from "@cabane/engine";
import { RoundedFurniturePanel } from "../../construction";

/** Welt cord follows the rounded cushion's equator, with a softly crowned face. */
export function TailoredCushion({
  size,
  position,
  rotation = [0, 0, 0],
  color,
  name,
}: {
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  name: string;
}) {
  const [w, h, d] = size;
  const piping = useMemo(() => {
    const r = Math.min(0.055, w / 5, d / 5);
    const points: Vector3[] = [];
    for (let corner = 0; corner < 4; corner++) {
      const angle = (corner * Math.PI) / 2;
      const cx = (corner === 0 || corner === 3 ? 1 : -1) * (w / 2 - r - 0.002);
      const cz = (corner < 2 ? 1 : -1) * (d / 2 - r - 0.002);
      for (let step = 0; step <= 4; step++) {
        const a = angle + ((step / 4) * Math.PI) / 2;
        points.push(new Vector3(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r));
      }
    }
    const geometry = new TubeGeometry(new CatmullRomCurve3(points, true), 64, 0.002, 4, true);
    // Keep spline overshoot inside the upholstered envelope, including the cord.
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!;
    geometry.scale(w / (bounds.max.x - bounds.min.x), 1, d / (bounds.max.z - bounds.min.z));
    return geometry;
  }, [w, d]);
  useEffect(() => () => piping.dispose(), [piping]);
  return (
    <group name={name} position={position} rotation={rotation}>
      <RoundedFurniturePanel
        size={size}
        color={color}
        radius={Math.min(0.07, h * 0.45)}
        outlineColor="#958775"
      />
      <mesh geometry={piping} dispose={null} castShadow>
        <ToonMaterial color="#bbae98" />
      </mesh>
    </group>
  );
}
