import { useEffect, useMemo } from "react";
import { SphereGeometry, Matrix4, Quaternion, Euler, Box3, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { OutdoorBasin } from "../outdoor/outdoor-basin";
export const LEAFY_PLANTER_SIZE = [0.8, 1.25, 0.8] as const;
/** Dense myrtle-like shrub with individually shaped, batched leaves. */
export function LeafyPlanter({
  size = LEAFY_PLANTER_SIZE,
  variant = "terracotta",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const leaves = useMemo(() => {
    const groups = Array.from({ length: 3 }, () => [] as SphereGeometry[]);
    for (let i = 0; i < 540; i++) {
      const a = i * 2.399963 + 0.55 * Math.sin(i * 17.17);
      const h = 1 - (2 * (i + 0.5)) / 540;
      const r = Math.sqrt(1 - h * h) * (0.85 + 0.15 * Math.sin(i * 12.73) ** 2);
      const g = new SphereGeometry(1, 6, 4);
      g.scale(0.027, 0.045, 0.018);
      g.applyMatrix4(
        new Matrix4().makeRotationFromQuaternion(
          new Quaternion().setFromEuler(
            new Euler(Math.sin(i * 7.3), a + Math.cos(i * 4.7), Math.sin(i * 3.1)),
          ),
        ),
      );
      g.translate(0.31 * r * Math.cos(a), 0.91 + 0.265 * h, 0.31 * r * Math.sin(a));
      groups[i % 3].push(g);
    }
    const result = groups.map((parts) => {
      const g = mergeGeometries(parts);
      parts.forEach((p) => p.dispose());
      return g;
    });
    const box = new Box3();
    result.forEach((g) => {
      g.computeBoundingBox();
      box.union(g.boundingBox!);
    });
    const extent = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const fit = new Matrix4()
      .makeScale(0.8 / extent.x, 0.61 / extent.y, 0.8 / extent.z)
      .multiply(new Matrix4().makeTranslation(-center.x, -box.min.y, -center.z));
    result.forEach((g) => {
      g.applyMatrix4(fit);
      g.translate(0, 0.64, 0);
    });
    return result;
  }, []);
  useEffect(() => () => leaves.forEach((g) => g.dispose()), [leaves]);
  return (
    <group scale={[size[0] / 0.8, size[1] / 1.25, size[2] / 0.8]}>
      <OutdoorBasin
        name="leafy-planter-pot"
        radius={0.23}
        height={0.42}
        position={[0, 0, 0]}
        color={variant === "ivory" ? "#d9cdb6" : "#b97b57"}
      />
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.205, 0.205, 0.02, 24]} />
        <ToonMaterial color="#65503b" />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.025, 0.04, 0.6, 8]} />
        <ToonMaterial color="#826547" />
      </mesh>
      {leaves.map((g, i) => (
        <mesh key={i} geometry={g} castShadow>
          <ToonMaterial color={["#607d42", "#758c4d", "#819956"][i]} />
        </mesh>
      ))}
    </group>
  );
}
