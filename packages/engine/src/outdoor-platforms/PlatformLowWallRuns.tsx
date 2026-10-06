import { useEffect, useMemo } from "react";
import { ExtrudeGeometry, Path, Shape } from "three";
import polygonClipping from "polygon-clipping";
import { Outlines, ToonMaterial } from "../rendering";
import type { OutdoorPlatformBarrier } from "./platform-barriers";
import { derivePlatformLowWallFootprints } from "./platform-low-wall-footprints";

/** Union equal-height runs so mitered corners have no internal faces or outline seams. */
export function PlatformLowWallRuns({ barriers }: { barriers: readonly OutdoorPlatformBarrier[] }) {
  const runs = useMemo(() => {
    const footprints = derivePlatformLowWallFootprints(barriers);
    const groups = new Map<string, { height: number; polygons: polygonClipping.Polygon[] }>();
    barriers.forEach((barrier, index) => {
      if (barrier.configuration.kind !== "low-wall") return;
      const height = barrier.configuration.heightMeters;
      const key = `${barrier.platformId}:${height}`;
      const group = groups.get(key) ?? { height, polygons: [] };
      group.polygons.push([footprints[index].map(([x, z]) => [x, z])]);
      groups.set(key, group);
    });
    return [...groups].map(([key, { height, polygons }]) => {
      const merged = polygonClipping.union(polygons[0], ...polygons.slice(1));
      const shapes = merged.map(rings => {
        const shape = new Shape();
        rings.forEach((ring, index) => {
          const path = index === 0 ? shape : new Path();
          ring.forEach(([x, z], i) => i === 0 ? path.moveTo(x, -z) : path.lineTo(x, -z));
          path.closePath();
          if (index) shape.holes.push(path);
        });
        return shape;
      });
      return { key, geometry: new ExtrudeGeometry(shapes, { depth: height, bevelEnabled: false }) };
    });
  }, [barriers]);
  useEffect(() => () => runs.forEach(run => run.geometry.dispose()), [runs]);
  return <group name="platform-low-walls">
    {runs.map(run => <mesh key={run.key} name={`platform-low-wall-${run.key}`} geometry={run.geometry} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <ToonMaterial color="#d4c6ae" />
      <Outlines color="#655e53" thickness={.6} />
    </mesh>)}
  </group>;
}
