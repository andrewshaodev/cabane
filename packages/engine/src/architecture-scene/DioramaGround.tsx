import type { DioramaLandscape } from "../WalkPreferences";
import { DioramaScenery } from "./DioramaScenery";
import { cutStairGroundOpenings } from "../stairs/ground-apertures";
import { useStairSurfaceApertures } from "../stairs/surface-apertures";
import { Shape } from "three";

import { memo, useMemo } from "react";

import { cutPoolOpenings, POOL_DEPTH_METERS } from "../pools";

import { GROUND_ELEVATION_METERS } from "../ground-elevation";

import { ToonMaterial } from "../rendering";

import type { FloorSpec } from "../types";

const roundedDioramaShape = (
  centerX: number,
  centerZ: number,
  width: number,
  depth: number,
  radius: number,
) => {
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  const near = centerZ - depth / 2;
  const far = centerZ + depth / 2;
  const shape = new Shape();
  shape.moveTo(left + radius, -near);
  shape.lineTo(right - radius, -near);
  shape.quadraticCurveTo(right, -near, right, -near - radius);
  shape.lineTo(right, -far + radius);
  shape.quadraticCurveTo(right, -far, right - radius, -far);
  shape.lineTo(left + radius, -far);
  shape.quadraticCurveTo(left, -far, left, -far + radius);
  shape.lineTo(left, -near - radius);
  shape.quadraticCurveTo(left, -near, left + radius, -near);
  shape.closePath();
  return shape;
};

export const DioramaTerrain = memo(function DioramaTerrain({
  landscape = "off",
  width,
  depth,
  centerX,
  centerZ,
  size,
  color,
  floor,
}: {
  landscape?: DioramaLandscape;
  width: number;
  depth: number;
  centerX: number;
  centerZ: number;
  size: number;
  color: string;
  floor: FloorSpec;
}) {
  const tileWidth = landscape === "off" ? size : width;
  const tileDepth = landscape === "off" ? size : depth;
  const apertures = useStairSurfaceApertures("floor");
  const baseShape = useMemo(
    () =>
      cutStairGroundOpenings(
        cutPoolOpenings(roundedDioramaShape(centerX, centerZ, tileWidth, tileDepth, 0.42), floor),
        floor.coordinates,
        apertures,
      ),
    [centerX, centerZ, tileWidth, tileDepth, floor, apertures],
  );
  const grassShape = useMemo(
    () =>
      cutStairGroundOpenings(
        cutPoolOpenings(
          roundedDioramaShape(centerX, centerZ, tileWidth - 0.1, tileDepth - 0.1, 0.36),
          floor,
        ),
        floor.coordinates,
        apertures,
      ),
    [centerX, centerZ, tileWidth, tileDepth, floor, apertures],
  );
  const topY = GROUND_ELEVATION_METERS;
  const grassThickness = 0.1;
  const baseThickness = floor.pools?.length
    ? POOL_DEPTH_METERS + 0.06
    : landscape === "off"
      ? 0.28
      : 0.85;
  return (
    <group>
      <mesh
        name="diorama-base"
        position={[0, topY - grassThickness - baseThickness, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <extrudeGeometry args={[baseShape, { depth: baseThickness, bevelEnabled: false }]} />
        <ToonMaterial
          color={landscape === "off" ? "#6f7d57" : landscape === "grass" ? "#78583e" : "#74756e"}
        />
      </mesh>
      <mesh
        name="diorama-ground"
        position={[0, topY - grassThickness, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <extrudeGeometry args={[grassShape, { depth: grassThickness, bevelEnabled: false }]} />
        <ToonMaterial
          color={landscape === "off" ? color : landscape === "grass" ? "#91a85d" : "#a4ad90"}
        />
      </mesh>
    </group>
  );
});

export const DioramaGround = memo(function DioramaGround(
  props: Parameters<typeof DioramaTerrain>[0],
) {
  return (
    <>
      <DioramaTerrain {...props} />
      {props.landscape && props.landscape !== "off" && (
        <DioramaScenery
          landscape={props.landscape}
          centerX={props.centerX}
          centerZ={props.centerZ}
          width={props.width}
          depth={props.depth}
        />
      )}
    </>
  );
});
