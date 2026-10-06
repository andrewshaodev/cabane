import {
  Shape
} from "three";

import { memo, useMemo } from "react";

import { cutPoolOpenings, POOL_DEPTH_METERS } from "../pools";

import { GROUND_ELEVATION_METERS } from "../ground-elevation";

import { ToonMaterial } from "../rendering";

import type {
  FloorSpec
} from "../types";

const roundedDioramaShape = (
  centerX: number,
  centerZ: number,
  size: number,
  radius: number,
) => {
  const left = centerX - size / 2;
  const right = centerX + size / 2;
  const near = centerZ - size / 2;
  const far = centerZ + size / 2;
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

export const DioramaGround = memo(function DioramaGround({
  centerX,
  centerZ,
  size,
  color,
  floor,
}: {
  centerX: number;
  centerZ: number;
  size: number;
  color: string;
  floor: FloorSpec;
}) {
  const baseShape = useMemo(
    () => cutPoolOpenings(roundedDioramaShape(centerX, centerZ, size, 0.42), floor),
    [centerX, centerZ, size, floor],
  );
  const grassShape = useMemo(
    () => cutPoolOpenings(roundedDioramaShape(centerX, centerZ, size - 0.1, 0.36), floor),
    [centerX, centerZ, size, floor],
  );
  const topY = GROUND_ELEVATION_METERS;
  const grassThickness = 0.1;
  const baseThickness = floor.pools?.length ? POOL_DEPTH_METERS + .06 : .28;
  return (
    <group>
      <mesh
        name="diorama-base"
        position={[0, topY - grassThickness - baseThickness, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <extrudeGeometry args={[baseShape, { depth: baseThickness, bevelEnabled: false }]} />
        <ToonMaterial color="#6f7d57" />
      </mesh>
      <mesh
        name="diorama-ground"
        position={[0, topY - grassThickness, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <extrudeGeometry args={[grassShape, { depth: grassThickness, bevelEnabled: false }]} />
        <ToonMaterial color={color} />
      </mesh>
    </group>
  );
});
