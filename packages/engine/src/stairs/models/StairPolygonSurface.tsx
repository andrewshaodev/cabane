import { useMemo } from "react";
import { Shape } from "three";
import type { ThreeElements } from "@react-three/fiber";
import { ToonMaterial } from "../../rendering";

/** Horizontal polygon slab; points are world X/Z metres. */
export function StairPolygonSurface({
  polygon,
  elevation,
  thickness = 0.12,
  color = "#cbb99a",
  emissive,
  ...props
}: {
  polygon: readonly (readonly [number, number])[];
  elevation: number;
  thickness?: number;
  color?: string;
  emissive?: string;
} & Omit<ThreeElements["mesh"], "position" | "rotation">) {
  const shape = useMemo(() => {
    const result = new Shape();
    polygon.forEach(([x, z], i) => (i ? result.lineTo(x, -z) : result.moveTo(x, -z)));
    result.closePath();
    return result;
  }, [polygon]);
  return (
    <mesh
      {...props}
      position={[0, elevation - thickness, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      castShadow
      receiveShadow
    >
      <extrudeGeometry args={[shape, { depth: thickness, bevelEnabled: false }]} />
      <ToonMaterial
        color={emissive ? "#000000" : color}
        emissive={emissive}
        emissiveIntensity={emissive ? 1 : 0}
        toneMapped={!emissive}
      />
    </mesh>
  );
}
