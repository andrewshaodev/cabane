import { Shape, Path } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const THIN_OVAL_MIRROR_SIZE = [0.4, 0.7, 0.012] as const;
const rim = new Shape();
rim.absellipse(0, 0.35, 0.2, 0.35, 0, Math.PI * 2, false);
const hole = new Path();
hole.absellipse(0, 0.35, 0.195, 0.345, 0, Math.PI * 2, true);
rim.holes.push(hole);
const glass = new Shape();
glass.absellipse(0, 0.35, 0.195, 0.345, 0, Math.PI * 2, false);
/** Oval silver-edged mirror with a wall-contact back plane at Z=0. */
export function ThinOvalMirror({ size = THIN_OVAL_MIRROR_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="thin-oval-mirror" scale={[size[0] / 0.4, size[1] / 0.7, size[2] / 0.012]}>
      <mesh name="oval-mirror-rim">
        <extrudeGeometry args={[rim, { depth: 0.012, bevelEnabled: false, curveSegments: 48 }]} />
        <ToonMaterial color="#aaaead" />
      </mesh>
      <mesh name="oval-mirror-glass" position={[0, 0, 0.002]}>
        <extrudeGeometry args={[glass, { depth: 0.006, bevelEnabled: false, curveSegments: 48 }]} />
        <ToonMaterial color="#a7bab6" />
      </mesh>
    </group>
  );
}
