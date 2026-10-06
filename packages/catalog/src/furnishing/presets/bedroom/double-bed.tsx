import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const DOUBLE_BED_SIZE = [1.7, 1.1, 2.15] as const;

/** A 160 × 200 cm mattress in a freestanding oak and upholstered frame. */
export function DoubleBed({ size = DOUBLE_BED_SIZE }: { size?: SceneItemSize }) {
  return <group name="double-bed" scale={[size[0] / 1.7, size[1] / 1.1, size[2] / 2.15]}
    userData={{ walkCollider: true }}>
    {[-.70, .70].flatMap((x) => [-.90, .90].map((z) => <mesh
      key={`${x}-${z}`} position={[x, .085, z]} castShadow>
      <boxGeometry args={[.065, .17, .065]} /><ToonMaterial color="#b58d5e" />
    </mesh>))}
    <RoundedFurniturePanel size={[1.7, .22, 2.15]} position={[0, .22, 0]}
      color="#cfaa76" radius={.014} />
    <RoundedFurniturePanel name="double-bed-headboard" size={[1.7, .88, .08]}
      position={[0, .66, -1.03]} color="#c9a571" radius={.022} />
    <RoundedFurniturePanel name="double-bed-padded-headboard" size={[1.56, .62, .07]}
      position={[0, .74, -.985]} color="#d4c6af" radius={.035} />
    <RoundedFurniturePanel name="double-bed-160x200-mattress" size={[1.6, .20, 2]}
      position={[0, .43, .035]} color="#efebe0" radius={.04} outlineColor="#aaa18f" />
    <RoundedFurniturePanel name="double-bed-duvet" size={[1.64, .10, 1.48]}
      position={[0, .57, .27]} color="#ded3c1" radius={.045} outlineColor="#a79b87" />
    {[-.40, .40].map((x) => <RoundedFurniturePanel key={x} name="double-bed-pillow"
      size={[.68, .11, .39]} position={[x, .60, -.68]} color="#f4f0e6"
      radius={.05} outlineColor="#b6ad9c" />)}
  </group>;
}
