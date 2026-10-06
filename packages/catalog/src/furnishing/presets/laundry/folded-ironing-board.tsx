import { Shape } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const FOLDED_IRONING_BOARD_SIZE = [0.38, 1.3, 0.055] as const;
const cover = new Shape();
cover.moveTo(-0.19, 0.07);
cover.lineTo(-0.19, 1.11);
cover.quadraticCurveTo(-0.19, 1.3, 0, 1.3);
cover.quadraticCurveTo(0.19, 1.3, 0.19, 1.11);
cover.lineTo(0.19, 0.07);
cover.quadraticCurveTo(0.19, 0, 0, 0);
cover.quadraticCurveTo(-0.19, 0, -0.19, 0.07);
cover.closePath();
export function FoldedIroningBoard({ size = FOLDED_IRONING_BOARD_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="folded-ironing-board" scale={[size[0] / 0.38, size[1] / 1.3, size[2] / 0.055]}>
      <mesh name="folded-board-cover" position={[0, 0, 0.022]} castShadow receiveShadow>
        <extrudeGeometry args={[cover, { depth: 0.033, bevelEnabled: false, curveSegments: 12 }]} />
        <ToonMaterial color="#a7aea7" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          name={`folded-board-rail-${side}`}
          position={[side * 0.12, 0.61, 0.014]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.006, 0.006, 1.18, 8]} />
          <ToonMaterial color="#bcc1bc" />
        </mesh>
      ))}
      {[0.22, 1.0].map((y) => (
        <mesh
          key={y}
          name={`folded-board-bracket-${y}`}
          position={[0, y, 0.015]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.26, 0.025, 0.03]} />
          <ToonMaterial color="#bcc1bc" />
        </mesh>
      ))}
    </group>
  );
}
