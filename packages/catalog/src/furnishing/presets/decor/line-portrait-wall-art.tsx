import { useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const LINE_PORTRAIT_WALL_ART_SIZE = [0.42, 0.62, 0.025] as const;
export function LinePortraitWallArt({
  size = LINE_PORTRAIT_WALL_ART_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const curves = useMemo(() => {
    const mirror = variant === "mirrored" ? -1 : 1;
    return [
      [
        [-0.13, 0.08],
        [-0.04, 0.13],
        [-0.09, 0.24],
        [-0.12, 0.36],
        [-0.08, 0.49],
        [0.02, 0.53],
        [0.11, 0.47],
        [0.09, 0.37],
        [0.03, 0.34],
        [0.07, 0.29],
        [0.01, 0.27],
        [0.03, 0.21],
        [0.12, 0.13],
        [0.13, 0.07],
      ],
      [
        [-0.06, 0.4],
        [0, 0.42],
        [0.015, 0.39],
        [0.065, 0.4],
      ],
      [
        [-0.065, 0.35],
        [-0.055, 0.29],
        [-0.02, 0.28],
        [0.04, 0.27],
      ],
      [
        [-0.04, 0.24],
        [0.0, 0.235],
        [0.04, 0.245],
      ],
    ].map(
      (points) => new CatmullRomCurve3(points.map(([x, y]) => new Vector3(x * mirror, y, 0.0225))),
    );
  }, [variant]);
  return (
    <group name="line-portrait-wall-art" scale={[size[0] / 0.42, size[1] / 0.62, size[2] / 0.025]}>
      <mesh position={[0, 0.31, 0.009]}>
        <boxGeometry args={[0.42, 0.62, 0.018]} />
        <ToonMaterial color="#242626" />
      </mesh>
      <mesh position={[0, 0.31, 0.019]}>
        <boxGeometry args={[0.403, 0.603, 0.002]} />
        <ToonMaterial color="#535555" />
      </mesh>
      {curves.map((curve, i) => (
        <mesh key={i} name="portrait-line">
          <tubeGeometry args={[curve, 40, 0.0025, 6, false]} />
          <ToonMaterial color="#e1e1d9" />
        </mesh>
      ))}
    </group>
  );
}
