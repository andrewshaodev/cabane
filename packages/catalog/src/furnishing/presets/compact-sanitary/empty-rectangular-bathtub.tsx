import { Path, Shape, Vector2 } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const EMPTY_RECTANGULAR_BATHTUB_SIZE = [1.6, 0.56, 0.7] as const;
const rim = new Shape();
rim.moveTo(-0.775, -0.35);
rim.lineTo(0.775, -0.35);
rim.quadraticCurveTo(0.8, -0.35, 0.8, -0.325);
rim.lineTo(0.8, 0.325);
rim.quadraticCurveTo(0.8, 0.35, 0.775, 0.35);
rim.lineTo(-0.775, 0.35);
rim.quadraticCurveTo(-0.8, 0.35, -0.8, 0.325);
rim.lineTo(-0.8, -0.325);
rim.quadraticCurveTo(-0.8, -0.35, -0.775, -0.35);
rim.closePath();
const hole = new Path();
hole.absellipse(0, 0, 0.73, 0.29, 0, Math.PI * 2, true);
rim.holes.push(hole);
const profile = [
  [0.745, 0.538],
  [0.73, 0.535],
  [0.69, 0.46],
  [0.61, 0.18],
  [0.57, 0.12],
  [0, 0.12],
  [0, 0.1],
  [0.58, 0.1],
  [0.63, 0.17],
  [0.71, 0.46],
  [0.751, 0.538],
].map(([x, y]) => new Vector2(x, y));
/** Empty fitted bath, without an invented deck tap or water surface. */
export function EmptyRectangularBathtub({
  size = EMPTY_RECTANGULAR_BATHTUB_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="empty-rectangular-bathtub"
      scale={[size[0] / 1.6, size[1] / 0.56, size[2] / 0.7]}
      userData={{ walkCollider: true }}
    >
      {[-0.339, 0.339].map((z) => (
        <RoundedFurniturePanel
          key={z}
          name="bath-long-apron"
          size={[1.6, 0.535, 0.022]}
          position={[0, 0.2675, z]}
          color="#eeece4"
          radius={0.003}
          outline={false}
        />
      ))}
      {[-0.789, 0.789].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="bath-end-apron"
          size={[0.022, 0.535, 0.654]}
          position={[x, 0.2675, 0]}
          color="#eeece4"
          radius={0.003}
          outline={false}
        />
      ))}
      <mesh name="bath-rim" position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[rim, { depth: 0.025, bevelEnabled: false, curveSegments: 24 }]} />
        <ToonMaterial color="#f4f2eb" />
      </mesh>
      <mesh name="bath-interior" scale={[1, 1, 0.29 / 0.73]}>
        <latheGeometry args={[profile, 48]} />
        <ToonMaterial color="#f0eee7" side={2} />
      </mesh>
      <mesh name="bath-drain" position={[0.48, 0.122, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.003, 20]} />
        <ToonMaterial color="#a8b0a9" />
      </mesh>
    </group>
  );
}
