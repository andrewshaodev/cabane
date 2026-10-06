import { Shape, ExtrudeGeometry } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const DRAPED_WHITE_TOWEL_SIZE = [0.33, 0.78, 0.04] as const;
const profile = new Shape();
profile.moveTo(0, 0.09);
profile.lineTo(0, 0.76);
profile.absarc(-0.02, 0.76, 0.02, 0, Math.PI, false);
profile.lineTo(-0.04, 0);
profile.lineTo(-0.034, 0);
profile.lineTo(-0.034, 0.76);
profile.absarc(-0.02, 0.76, 0.014, Math.PI, 0, true);
profile.lineTo(-0.006, 0.09);
profile.closePath();
const cloth = new ExtrudeGeometry(profile, { depth: 0.33, bevelEnabled: false, curveSegments: 16 })
  .translate(0, 0, -0.165)
  .rotateY(Math.PI / 2);
/** Plain folded towel: the open upper fold fits a 24 mm tubular rung. Back plane Z=0. */
export function DrapedWhiteTowel({
  size = DRAPED_WHITE_TOWEL_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group name="draped-white-towel" scale={[size[0] / 0.33, size[1] / 0.78, size[2] / 0.04]}>
      <mesh name="towel-cloth" geometry={cloth}>
        <ToonMaterial color={variant === "grey" ? "#777a72" : "#eeeae0"} side={2} />
      </mesh>
    </group>
  );
}
