import { memo, useMemo, useLayoutEffect, useRef } from "react";
import { Color, Object3D, type InstancedMesh } from "three";
import { GROUND_ELEVATION_METERS } from "../ground-elevation";

type Detail = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  rotation: number;
  color: string;
};
function DetailBatch({ details, blade = false }: { details: Detail[]; blade?: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current!;
    const transform = new Object3D();
    const color = new Color();
    details.forEach((item, i) => {
      transform.position.set(item.x, item.y, item.z);
      transform.scale.set(item.sx, item.sy, item.sz);
      transform.rotation.set(0, item.rotation, blade ? 0.2 : 0);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
      mesh.setColorAt(i, color.set(item.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [details, blade]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, details.length]}
      castShadow={!blade}
      receiveShadow
    >
      {blade ? <coneGeometry args={[1, 1, 3]} /> : <icosahedronGeometry args={[1, 1]} />}
      <meshStandardMaterial roughness={0.95} />
    </instancedMesh>
  );
}

/** Deterministic, bounded scatter in the added margin, never in the authored garden. */
export const DioramaScenery = memo(function DioramaScenery({
  landscape,
  centerX,
  centerZ,
  width,
  depth,
}: {
  landscape: "grass" | "mountain";
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
}) {
  const details = useMemo(() => {
    let seed = 4817;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const leaves: Detail[] = [],
      grass: Detail[] = [],
      flowers: Detail[] = [],
      rocks: Detail[] = [],
      trunks: Detail[] = [];
    const alpine = landscape === "mountain";
    const add = (
      list: Detail[],
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      color: string,
    ) => list.push({ x, y, z, sx, sy, sz, color, rotation: random() * Math.PI * 2 });
    const greens = alpine
      ? ["#355849", "#496c4c", "#5f7850", "#7a8954"]
      : ["#405c27", "#537332", "#6e883b", "#8d9e4c", "#a0aa56"];
    const green = () => greens[Math.floor(random() * greens.length)];
    const perimeter = 2 * (width + depth);
    // A natural, irregular planting ribbon. Four strips avoid rejected samples on long homes.
    const point = (margin: number, spread: number) => {
      const t = random() * perimeter;
      const inset = margin + random() * spread;
      if (t < width) return [-width / 2 + 0.6 + random() * (width - 1.2), -depth / 2 + inset];
      if (t < width + depth)
        return [width / 2 - inset, -depth / 2 + 0.6 + random() * (depth - 1.2)];
      if (t < 2 * width + depth)
        return [-width / 2 + 0.6 + random() * (width - 1.2), depth / 2 - inset];
      return [-width / 2 + inset, -depth / 2 + 0.6 + random() * (depth - 1.2)];
    };
    for (let i = 0; i < Math.min(22000, perimeter * 110); i++) {
      const [x, z] = point(0.24, 2.7);
      const h = 0.07 + random() * 0.2;
      add(grass, x, h / 2, z, 0.015 + random() * 0.025, h, 0.012, green());
    }
    for (let i = 0; i < Math.min(150, perimeter * 1.7); i++) {
      const [x, z] = point(0.65, 1.5);
      const radius = 0.23 + random() * 0.36;
      for (let j = 0; j < 16; j++) {
        const angle = random() * Math.PI * 2,
          r = random() * radius;
        add(
          leaves,
          x + Math.cos(angle) * r,
          0.13 + random() * radius,
          z + Math.sin(angle) * r,
          0.12 + random() * 0.14,
          0.12 + random() * 0.16,
          0.12 + random() * 0.14,
          green(),
        );
      }
      if (i % 3 === 0)
        for (let j = 0; j < 12; j++) {
          const a = random() * 6.28,
            r = random() * radius;
          add(
            flowers,
            x + Math.cos(a) * r,
            0.25 + radius * 0.6 + random() * 0.12,
            z + Math.sin(a) * r,
            0.045,
            0.035,
            0.045,
            ["#f5e8c5", "#e9bd58", "#c87985", "#e6a6b0"][i % 4],
          );
        }
    }
    for (let i = 0; i < Math.min(32, perimeter / 3.7); i++) {
      const [x, z] = point(1.1, 0.65);
      const height = 1.35 + random() * 1.1;
      add(trunks, x, height / 2, z, 0.08, height / 2, 0.08, "#715039");
      for (let j = 0; j < 90; j++) {
        const a = random() * 6.28,
          y = random(),
          r = Math.sqrt(random()) * (alpine ? (1 - y) * 0.7 : Math.sin(y * Math.PI) * 0.7);
        add(
          leaves,
          x + Math.cos(a) * r,
          height * 0.5 + y * height * 0.75,
          z + Math.sin(a) * r,
          0.15 + random() * 0.12,
          0.18 + random() * 0.13,
          0.15 + random() * 0.12,
          green(),
        );
      }
    }
    for (let i = 0; i < Math.min(900, perimeter * 12); i++) {
      const [x, z] = point(0.3, 2.3);
      const r = (alpine ? 0.08 : 0.04) + random() * (alpine ? 0.3 : 0.1);
      add(rocks, x, r * 0.3, z, r, r * 0.65, r * 0.85, ["#8c8b75", "#aaa18a", "#746e59"][i % 3]);
    }
    // Exposed aggregates break up the otherwise perfectly smooth cut-earth sides.
    for (let i = 0; i < Math.min(2200, perimeter * 26); i++) {
      const t = random() * perimeter;
      let x, z;
      if (t < width) {
        x = t - width / 2;
        z = -depth / 2 + 0.06;
      } else if (t < width + depth) {
        x = width / 2 - 0.06;
        z = t - width - depth / 2;
      } else if (t < 2 * width + depth) {
        x = t - width - depth - width / 2;
        z = depth / 2 - 0.06;
      } else {
        x = -width / 2 + 0.06;
        z = t - 2 * width - depth - depth / 2;
      }
      if (Math.abs(x) > width / 2 - 0.45 && Math.abs(z) > depth / 2 - 0.45) continue;
      const r = 0.035 + random() * 0.12;
      add(
        rocks,
        x,
        -0.15 - random() * 0.62,
        z,
        r,
        r * 0.65,
        r,
        ["#564637", "#8a7152", "#a38a66", "#6b6250"][i % 4],
      );
    }
    return { leaves, grass, flowers, rocks, trunks };
  }, [width, depth, landscape]);
  return (
    <group
      name={`diorama-${landscape}-scenery`}
      position={[centerX, GROUND_ELEVATION_METERS, centerZ]}
    >
      <DetailBatch details={details.grass} blade />
      <DetailBatch details={details.leaves} />
      <DetailBatch details={details.flowers} />
      <DetailBatch details={details.rocks} />
      <DetailBatch details={details.trunks} />
    </group>
  );
});
