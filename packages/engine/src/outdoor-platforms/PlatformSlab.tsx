import { useEffect, useMemo } from "react";
import { ExtrudeGeometry, Path, Shape } from "three";
import { ToonMaterial } from "../rendering";
import { useStairSurfaceApertures } from "../stairs/surface-apertures";
import polygonClipping from "polygon-clipping";
import { planPointToWorld } from "../geometry";
import type { FloorSpec, OutdoorPlatformSpec } from "../types";
import { derivePlatformSlabPieces } from "./platform-slab-coverage";
/** One slab, with its underside matching any authored room ceiling below. */
export function PlatformSlab({
  platform,
  floor,
  below,
}: {
  platform: OutdoorPlatformSpec;
  floor: FloorSpec;
  below?: FloorSpec;
}) {
  const apertures = useStairSurfaceApertures("floor");
  const pieces = useMemo(
    () =>
      derivePlatformSlabPieces(platform, floor, below).map((piece) => {
        const clipped = apertures.length
          ? polygonClipping.difference(
              piece.polygon,
              ...apertures.map((p) => [
                p.map(
                  (point) => [...planPointToWorld(point, floor.coordinates)] as [number, number],
                ),
              ]),
            )
          : [piece.polygon];
        const shapes = clipped.map((rings) => {
          const shape = new Shape();
          rings.forEach((ring, index) => {
            const path = index === 0 ? shape : new Path();
            ring.forEach(([x, z], i) => (i === 0 ? path.moveTo(x, -z) : path.lineTo(x, -z)));
            path.closePath();
            if (index) shape.holes.push(path);
          });
          return shape;
        });
        return {
          ...piece,
          geometry: new ExtrudeGeometry(shapes, { depth: piece.depth, bevelEnabled: false }),
        };
      }),
    [platform.polygon, floor.coordinates, below, apertures],
  );
  useEffect(() => () => pieces.forEach((piece) => piece.geometry.dispose()), [pieces]);
  return (
    <group name={`platform-slab-${platform.id}`}>
      {pieces.map((piece, index) => (
        <mesh
          key={index}
          geometry={piece.geometry}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, piece.bottom, 0]}
          castShadow
          receiveShadow
        >
          <ToonMaterial color="#d4c6ae" />
        </mesh>
      ))}
    </group>
  );
}
