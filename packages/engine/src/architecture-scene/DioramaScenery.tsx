import { memo } from "react";
import { GROUND_ELEVATION_METERS } from "../ground-elevation";
import { ToonMaterial } from "../rendering";

/** All scenery stays inside the added border, clear of the authored floor and pools. */
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
  const alpine = landscape === "mountain";
  const countX = Math.min(12, Math.max(3, Math.floor(width / 2.8)));
  const countZ = Math.min(12, Math.max(3, Math.floor(depth / 2.8)));
  const points = [
    ...Array.from({ length: countX }, (_, i) => [
      -width / 2 + 1.4 + ((width - 2.8) * i) / (countX - 1),
      -depth / 2 + 1.25,
    ]),
    ...Array.from({ length: countZ }, (_, i) => [
      width / 2 - 1.25,
      -depth / 2 + 2.8 + ((depth - 5.6) * i) / (countZ - 1),
    ]),
    ...Array.from({ length: countX }, (_, i) => [
      -width / 2 + 1.4 + ((width - 2.8) * i) / (countX - 1),
      depth / 2 - 1.25,
    ]),
    ...Array.from({ length: countZ }, (_, i) => [
      -width / 2 + 1.25,
      -depth / 2 + 2.8 + ((depth - 5.6) * i) / (countZ - 1),
    ]),
  ];
  return (
    <group
      name={`diorama-${landscape}-scenery`}
      position={[centerX, GROUND_ELEVATION_METERS, centerZ]}
    >
      {points.map(([x, z], i) => {
        const scale = 0.65 + ((i * 17) % 11) / 24;
        const tree = i % 3 === 0;
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, i * 2.4, 0]} scale={scale}>
            {tree ? (
              <>
                <mesh position={[0, 0.5, 0]} castShadow>
                  <cylinderGeometry args={[0.09, 0.14, 1, 7]} />
                  <ToonMaterial color="#78543b" />
                </mesh>
                {alpine ? (
                  [0, 1, 2].map((tier) => (
                    <mesh key={tier} position={[0, 0.95 + tier * 0.43, 0]} castShadow receiveShadow>
                      <coneGeometry args={[0.8 - tier * 0.18, 1.25, 9]} />
                      <ToonMaterial color={tier === 2 ? "#527968" : "#365e50"} />
                    </mesh>
                  ))
                ) : (
                  <>
                    <mesh
                      position={[0, 1.35, 0]}
                      scale={[0.95, 1.1, 0.85]}
                      castShadow
                      receiveShadow
                    >
                      <icosahedronGeometry args={[0.85, 1]} />
                      <ToonMaterial color="#638747" />
                    </mesh>
                    <mesh position={[0.45, 1.15, 0.15]} castShadow receiveShadow>
                      <icosahedronGeometry args={[0.55, 1]} />
                      <ToonMaterial color="#8da452" />
                    </mesh>
                  </>
                )}
              </>
            ) : (
              <mesh
                position={[0, alpine ? 0.35 : 0.16, 0]}
                scale={alpine ? [1.1, 0.85 + (i % 3) * 0.45, 0.85] : [0.55, 0.3, 0.45]}
                castShadow
                receiveShadow
              >
                <icosahedronGeometry args={[0.8, alpine ? 0 : 1]} />
                <ToonMaterial color={alpine ? (i % 2 ? "#92978d" : "#b4b5a8") : "#768c4d"} />
              </mesh>
            )}
            {!alpine &&
              [0, 1, 2].map((flower) => (
                <mesh
                  key={flower}
                  position={[-0.65 + flower * 0.22, 0.12, 0.45 + (flower % 2) * 0.2]}
                >
                  <icosahedronGeometry args={[0.07, 0]} />
                  <ToonMaterial color={i % 2 ? "#edd891" : "#f0e8d0"} />
                </mesh>
              ))}
          </group>
        );
      })}
    </group>
  );
});
