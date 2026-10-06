import { Path, Shape } from "three";
import { LaundryPlatformFront } from "./laundry-platform-front";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";

export const VENTED_LAUNDRY_PLATFORM_SIZE = [2.55, 0.1, 0.65] as const;

/** Hollow white podium with an apertured deck and ventilated front plinth. */
export function VentedLaundryPlatform({
  size = VENTED_LAUNDRY_PLATFORM_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const [width, height, depth] = VENTED_LAUNDRY_PLATFORM_SIZE;
  const slab = new Shape();
  slab.moveTo(-width / 2, 0);
  slab.lineTo(width / 2, 0);
  slab.lineTo(width / 2, -depth);
  slab.lineTo(-width / 2, -depth);
  slab.closePath();
  const apertures =
    variant === "fan-right"
      ? [
          [-0.19 * width, 0.83 * depth, 0.024],
          [0.19 * width, 0.85 * depth, 0.055],
        ]
      : [
          [0.19 * width, 0.83 * depth, 0.02],
          [-0.19 * width, 0.63 * depth, 0.024],
          [-0.19 * width, 0.85 * depth, 0.055],
        ];
  for (const [x, z, r] of apertures) {
    const hole = new Path();
    hole.absarc(x, -z, r, 0, Math.PI * 2, true);
    slab.holes.push(hole);
  }
  return (
    <group
      name="vented-laundry-platform"
      scale={[size[0] / width, size[1] / height, size[2] / depth]}
      userData={{ walkCollider: true }}
    >
      <mesh
        name="laundry-platform-slab"
        position={[0, height - 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <extrudeGeometry args={[slab, { depth: 0.02, bevelEnabled: false, curveSegments: 24 }]} />
        <ToonMaterial color="#eae8df" />
      </mesh>
      <LaundryPlatformFront width={width} height={height - 0.02} depth={depth} />
      <mesh
        name="laundry-platform-back"
        position={[0, (height - 0.02) / 2, 0.009]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, height - 0.02, 0.018]} />
        <ToonMaterial color="#eae8df" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          name="laundry-platform-end"
          position={[(side * (width - 0.018)) / 2, (height - 0.02) / 2, depth / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.018, height - 0.02, depth - 0.036]} />
          <ToonMaterial color="#eae8df" />
        </mesh>
      ))}
    </group>
  );
}
