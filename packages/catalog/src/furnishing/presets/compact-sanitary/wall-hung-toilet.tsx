import { Shape } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { ConcealedToiletBowl } from "../bathroom/concealed-toilet-bowl";
export const WALL_HUNG_TOILET_SIZE = [0.4, 0.715, 0.56] as const;
const lid = new Shape();
lid.absellipse(0, 0.48, 0.185, 0.235, 0, Math.PI * 2, false);
/** Reuses the hollow ceramic bowl; underside origin is the wall mounting height. */
export function WallHungToilet({
  size = WALL_HUNG_TOILET_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const black = variant === "black";
  return (
    <group
      name="wall-hung-toilet"
      scale={[size[0] / 0.4, size[1] / 0.715, size[2] / 0.56]}
      userData={{ walkCollider: true }}
    >
      <group position={[0, -0.19, -0.158]} rotation={[0, -Math.PI / 2, 0]}>
        <ConcealedToiletBowl
          ceramicColor={black ? "#242824" : "#e9e7e0"}
          seatColor={black ? "#292c29" : "#faf9f4"}
          supportColor={black ? "#353b34" : "#d8d6cf"}
        />
      </group>
      <RoundedFurniturePanel
        name="wall-connection"
        size={[0.28, 0.12, 0.12]}
        position={[0, 0.14, 0.06]}
        color={black ? "#242824" : "#ecece6"}
        radius={0.018}
        outline={false}
      />
      <mesh name="raised-toilet-lid" position={[0, 0, 0.0475]} castShadow>
        <extrudeGeometry args={[lid, { depth: 0.015, bevelEnabled: false, curveSegments: 24 }]} />
        <ToonMaterial color={black ? "#292c29" : "#f5f4ec"} />
      </mesh>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} name="lid-hinge" position={[x, 0.251, 0.055]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.009, 0.009, 0.045, 16]} />
          <ToonMaterial color={black ? "#353b34" : "#deded7"} />
        </mesh>
      ))}
    </group>
  );
}
