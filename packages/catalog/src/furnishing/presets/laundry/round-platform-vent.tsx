import { Path, Shape } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";

export const ROUND_PLATFORM_VENT_SIZE = [0.06, 0.01, 0.06] as const;
const rim = new Shape();
rim.absarc(0, 0, 0.03, 0, Math.PI * 2, false);
const hole = new Path();
hole.absarc(0, 0, 0.0255, 0, Math.PI * 2, true);
rim.holes.push(hole);

/** Horizontal inset grille with an open rim and five recessed louvers. */
export function RoundPlatformVent({ size = ROUND_PLATFORM_VENT_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="round-platform-vent" scale={[size[0] / 0.06, size[1] / 0.01, size[2] / 0.06]}>
      <mesh name="platform-vent-rim" rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[rim, { depth: 0.01, bevelEnabled: false, curveSegments: 24 }]} />
        <ToonMaterial color="#e5e3d9" />
      </mesh>
      {[-2, -1, 0, 1, 2].map((index) => (
        <mesh
          key={index}
          name={`platform-vent-louver-${index}`}
          position={[0, 0.007, index * 0.008]}
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[2 * Math.sqrt(0.0255 ** 2 - (index * 0.008) ** 2) + 0.003, 0.004, 0.004]}
          />
          <ToonMaterial color="#e5e3d9" />
        </mesh>
      ))}
    </group>
  );
}
