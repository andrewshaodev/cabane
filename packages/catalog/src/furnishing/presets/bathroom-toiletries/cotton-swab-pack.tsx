import { useEffect, useMemo } from "react";
import { CylinderGeometry, Matrix4 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const COTTON_SWAB_PACK_SIZE = [0.14, 0.016, 0.08] as const;
/** Simplified clear packet of twelve parallel swabs, with two cotton tips touching each shaft. */
export function CottonSwabPack({ size = COTTON_SWAB_PACK_SIZE }: { size?: SceneItemSize }) {
  const parts = useMemo(() => {
    const shafts = [],
      tips = [];
    for (let row = 0; row < 12; row++) {
      const z = (row - 5.5) * 0.0055;
      shafts.push(
        new CylinderGeometry(0.0015, 0.0015, 0.086, 6)
          .applyMatrix4(new Matrix4().makeRotationZ(Math.PI / 2))
          .translate(0, 0.004, z),
      );
      for (const side of [-1, 1])
        tips.push(
          new CylinderGeometry(0.004, 0.004, 0.012, 6)
            .applyMatrix4(new Matrix4().makeRotationZ(Math.PI / 2))
            .translate(side * 0.049, 0.004, z),
        );
    }
    const result = { shafts: mergeGeometries(shafts), tips: mergeGeometries(tips) };
    [...shafts, ...tips].forEach((g) => g.dispose());
    return result;
  }, []);
  useEffect(
    () => () => {
      parts.shafts.dispose();
      parts.tips.dispose();
    },
    [parts],
  );
  return (
    <group name="cotton-swab-pack" scale={[size[0] / 0.14, size[1] / 0.016, size[2] / 0.08]}>
      <mesh name="swab-packet" position={[0, 0.008, 0]}>
        <boxGeometry args={[0.14, 0.016, 0.08]} />
        <ToonMaterial color="#e5e8dd" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh name="swab-shafts" geometry={parts.shafts}>
        <ToonMaterial color="#eceae3" />
      </mesh>
      <mesh name="swab-cotton-tips" geometry={parts.tips}>
        <ToonMaterial color="#f4f0e7" />
      </mesh>
    </group>
  );
}
