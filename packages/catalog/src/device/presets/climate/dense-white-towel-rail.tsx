import { useEffect, useMemo } from "react";
import { CylinderGeometry, Matrix4 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToonMaterial, type HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";
/** Tubular white ladder with two groups of closely spaced rails and a towel gap. */
export function DenseWhiteTowelRail({
  visualState,
  variant,
}: Pick<HomeDeviceModelProps, "visualState" | "variant">) {
  const black = variant === "dense-black";
  const color = black ? "#292c2a" : "#e8e8df";
  const rungs = useMemo(() => {
    const heights = black
      ? [
          ...Array.from({ length: 9 }, (_, i) => 0.04 + i * 0.04),
          ...Array.from({ length: 10 }, (_, i) => 0.46 + i * 0.04),
          ...Array.from({ length: 5 }, (_, i) => 0.96 + i * 0.054),
        ]
      : [
          ...Array.from({ length: 18 }, (_, i) => 0.04 + i * 0.046),
          ...Array.from({ length: 6 }, (_, i) => 0.93 + i * 0.046),
        ];
    const parts = heights.map((y) =>
      new CylinderGeometry(0.012, 0.012, 0.57, 12).applyMatrix4(
        new Matrix4().makeRotationZ(Math.PI / 2).setPosition(0, y, 0.06),
      ),
    );
    const geometry = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return geometry;
  }, [black]);
  useEffect(() => () => rungs.dispose(), [rungs]);
  return (
    <group name="dense-white-towel-rail">
      {[-0.285, 0.285].map((x) => (
        <mesh key={x} name="towel-rail-upright" position={[x, 0.6, 0.06]}>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 12]} />
          <ToonMaterial color={color} />
        </mesh>
      ))}
      <mesh name="towel-rail-rungs" geometry={rungs}>
        <ToonMaterial color={black ? color : "#efeee7"} />
      </mesh>
      {[-0.285, 0.285].flatMap((x) =>
        [0.15, 1.05].map((y) => (
          <mesh
            key={`${x}-${y}`}
            name="towel-rail-wall-mount"
            position={[x, y, 0.025]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.013, 0.013, 0.05, 12]} />
            <ToonMaterial color={color} />
          </mesh>
        )),
      )}
      <mesh position={[0.25, 0.035, 0.0975]}>
        <boxGeometry args={[0.065, 0.07, 0.045]} />
        <ToonMaterial color={black ? color : "#d8dad2"} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.25, 0.078, 0.1105]} scale={0.3} />
    </group>
  );
}
