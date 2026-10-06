import { CurvePath, LineCurve3, QuadraticBezierCurve3, Vector3 } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const BRASS_BATH_SHOWER_COLUMN_SIZE = [0.27, 1.341, 0.38] as const;
const v = (y: number, z: number) => new Vector3(0, y, z);
const pipe = new CurvePath<Vector3>();
pipe.add(new LineCurve3(v(0.04, 0.08), v(1.25, 0.08)));
pipe.add(new QuadraticBezierCurve3(v(1.25, 0.08), v(1.33, 0.08), v(1.33, 0.16)));
pipe.add(new LineCurve3(v(1.33, 0.16), v(1.33, 0.26)));
const hose = new QuadraticBezierCurve3(
  new Vector3(0.065, 0.54, 0.11),
  new Vector3(0.12, -0.115, 0.22),
  new Vector3(-0.08, 0.03, 0.11),
);
export function BrassBathShowerColumn({
  size = BRASS_BATH_SHOWER_COLUMN_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const metal = variant === "black" ? "#292c2a" : "#bfa26c";
  const highlight = variant === "black" ? "#363a36" : "#c8ab72";
  const hoseColor = variant === "black" ? "#303430" : "#b59b65";
  return (
    <group
      name="brass-bath-shower-column"
      scale={[size[0] / 0.27, size[1] / 1.341, size[2] / 0.38]}
    >
      <mesh name="thermostatic-mixer" position={[0, 0.03, 0.08]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.27, 20]} />
        <ToonMaterial color={metal} />
      </mesh>
      {[-0.07, 0.07].map((x) => (
        <mesh
          key={x}
          name="mixer-wall-connection"
          position={[x, 0.03, 0.025]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.02, 0.02, 0.05, 16]} />
          <ToonMaterial color={metal} />
        </mesh>
      ))}
      <mesh name="shower-riser">
        <tubeGeometry args={[pipe, 48, 0.011, 8, false]} />
        <ToonMaterial color={highlight} />
      </mesh>
      <mesh name="rain-head-stem" position={[0, 1.32, 0.26]}>
        <cylinderGeometry args={[0.008, 0.008, 0.04, 12]} />
        <ToonMaterial color={metal} />
      </mesh>
      <mesh name="rain-head" position={[0, 1.3, 0.26]}>
        <cylinderGeometry args={[0.12, 0.12, 0.03, 32]} />
        <ToonMaterial color={metal} />
      </mesh>
      <mesh name="tube-hand-shower" position={[0.065, 0.66, 0.11]}>
        <cylinderGeometry args={[0.01, 0.01, 0.24, 16]} />
        <ToonMaterial color={highlight} />
      </mesh>
      <RoundedFurniturePanel
        name="hand-shower-clip"
        size={[0.065, 0.025, 0.042]}
        position={[0.0325, 0.59, 0.11]}
        color={metal}
        radius={0.003}
        outline={false}
      />
      <mesh name="shower-hose">
        <tubeGeometry args={[hose, 32, 0.003, 6, false]} />
        <ToonMaterial color={hoseColor} />
      </mesh>
    </group>
  );
}
