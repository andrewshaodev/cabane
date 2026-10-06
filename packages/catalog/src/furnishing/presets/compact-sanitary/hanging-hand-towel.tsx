import { Shape } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const HANGING_HAND_TOWEL_SIZE = [0.24, 0.66, 0.02] as const;
const cloth = new Shape();
cloth.moveTo(-0.02, 0.65);
cloth.quadraticCurveTo(-0.09, 0.61, -0.1, 0.52);
cloth.lineTo(-0.12, 0.1);
cloth.quadraticCurveTo(-0.12, 0, -0.07, 0);
cloth.lineTo(0.1, 0);
cloth.quadraticCurveTo(0.12, 0, 0.12, 0.1);
cloth.lineTo(0.08, 0.52);
cloth.quadraticCurveTo(0.045, 0.6, 0.02, 0.65);
cloth.quadraticCurveTo(0, 0.67, -0.02, 0.65);
cloth.closePath();
/** Grey hand towel with a gathered upper silhouette; independently placeable on a ring. */
export function HangingHandTowel({ size = HANGING_HAND_TOWEL_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="hanging-hand-towel" scale={[size[0] / 0.24, size[1] / 0.66, size[2] / 0.02]}>
      <mesh name="hand-towel-cloth">
        <extrudeGeometry args={[cloth, { depth: 0.02, bevelEnabled: false, curveSegments: 24 }]} />
        <ToonMaterial color="#777a72" side={2} />
      </mesh>
    </group>
  );
}
