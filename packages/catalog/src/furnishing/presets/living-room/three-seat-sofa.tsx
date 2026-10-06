import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

import { TailoredCushion } from "./sofa-upholstery";

export const THREE_SEAT_SOFA_SIZE = [2.2, 0.84, 0.94] as const;

/** Warm contemporary sofa. Floor origin, with the seats facing +Z. */
export function ThreeSeatSofa({ size = THREE_SEAT_SOFA_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="three-seat-sofa"
      scale={[size[0] / 2.2, size[1] / 0.84, size[2] / 0.94]}
      userData={{ walkCollider: true }}
    >
      {[-0.94, 0.94].flatMap((x) =>
        [-0.33, 0.33].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.065, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.028, 0.13, 10]} />
            <ToonMaterial color="#9d7953" />
          </mesh>
        )),
      )}
      <RoundedFurniturePanel
        name="recessed-oak-base"
        size={[2.04, 0.055, 0.79]}
        position={[0, 0.1375, 0.01]}
        color="#a78054"
        radius={0.012}
      />
      <RoundedFurniturePanel
        size={[2.12, 0.25, 0.88]}
        position={[0, 0.235, 0.01]}
        color="#c8b9a1"
        radius={0.055}
      />
      <RoundedFurniturePanel
        size={[1.86, 0.47, 0.16]}
        position={[0, 0.545, -0.38]}
        color="#cbbda7"
        radius={0.035}
      />
      {[-1, 1].map((side) => (
        <RoundedFurniturePanel
          key={side}
          name="sofa-arm"
          size={[0.22, 0.47, 0.94]}
          position={[side * 0.99, 0.415, 0]}
          color="#d6c8b2"
          radius={0.07}
        />
      ))}
      {[-0.596, 0, 0.596].map((x) => (
        <group key={x}>
          <TailoredCushion
            name="sofa-seat-cushion"
            size={[0.582, 0.145, 0.67]}
            position={[x, 0.4175, 0.08]}
            color="#e2d5bf"
          />
          <TailoredCushion
            name="sofa-back-cushion"
            size={[0.582, 0.17, 0.4]}
            position={[x, 0.631, -0.275]}
            rotation={[Math.PI / 2 - 0.12, 0, 0]}
            color="#ded0b9"
          />
        </group>
      ))}
    </group>
  );
}
