import { useEffect, useMemo } from "react";
import { CylinderGeometry, Matrix4, Vector3, Quaternion } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { HollowBathroomCup } from "./hollow-bathroom-cup";
export const TOOTHBRUSH_CUP_SIZE = [0.072, 0.232, 0.072] as const;
export function ToothbrushCup({ size = TOOTHBRUSH_CUP_SIZE }: { size?: SceneItemSize }) {
  const ribs = useMemo(() => {
    const parts = Array.from({ length: 24 }, (_, i) => {
      const angle = (i * Math.PI) / 12,
        a = new Vector3(Math.cos(angle) * 0.0295, 0.012, Math.sin(angle) * 0.0295),
        b = new Vector3(Math.cos(angle) * 0.0355, 0.119, Math.sin(angle) * 0.0355),
        direction = b.clone().sub(a);
      return new CylinderGeometry(0.0005, 0.0005, direction.length(), 6).applyMatrix4(
        new Matrix4().compose(
          a.clone().add(b).multiplyScalar(0.5),
          new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()),
          new Vector3(1, 1, 1),
        ),
      );
    });
    const g = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return g;
  }, []);
  useEffect(() => () => ribs.dispose(), [ribs]);
  return (
    <group name="toothbrush-cup" scale={[size[0] / 0.072, size[1] / 0.232, size[2] / 0.072]}>
      <HollowBathroomCup color="#e9e5da" height={0.12} />
      <mesh name="cup-fluting" geometry={ribs}>
        <ToonMaterial color="#d6d1c5" />
      </mesh>
      <RoundedFurniturePanel
        name="toothpaste-tube"
        size={[0.024, 0.188, 0.014]}
        position={[-0.01, 0.1036, 0.004]}
        color="#e6e5dc"
        radius={0.004}
        outline={false}
      />
      <RoundedFurniturePanel
        name="toothpaste-cap"
        size={[0.025, 0.02, 0.016]}
        position={[-0.01, 0.2076, 0.004]}
        color="#f4f2e8"
        radius={0.002}
        outline={false}
      />
      <RoundedFurniturePanel
        name="toothpaste-colour-label"
        size={[0.019, 0.03, 0.002]}
        position={[-0.01, 0.162, 0.013]}
        color="#8bb643"
        radius={0.001}
        outline={false}
      />
      <mesh name="toothbrush-stem" position={[0.013, 0.1121, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.205, 10]} />
        <ToonMaterial color="#eae8dd" />
      </mesh>
      <RoundedFurniturePanel
        name="toothbrush-head"
        size={[0.012, 0.025, 0.014]}
        position={[0.013, 0.2195, 0]}
        color="#d8dfcd"
        radius={0.003}
        outline={false}
      />
    </group>
  );
}
