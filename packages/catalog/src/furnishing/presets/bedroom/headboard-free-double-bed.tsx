import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const HEADBOARD_FREE_DOUBLE_BED_SIZE = [1.64,0.66,2.04] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function HeadboardFreeDoubleBed({ size = HEADBOARD_FREE_DOUBLE_BED_SIZE }: { size?: SceneItemSize }) {
 return <group name="headboard-free-double-bed" scale={[size[0]/1.64,size[1]/0.66,size[2]/2.04]} userData={{ walkCollider: true }}>
{[-.70,.70].flatMap(x=>[-.90,.90].map(z=><mesh key={`${x}-${z}`} position={[x,.10,z]}><boxGeometry args={[.06,.20,.06]} /><ToonMaterial color="#dfddd5" /></mesh>))}
<RoundedFurniturePanel size={[1.64,.20,2.04]} position={[0,.25,0]} color="#e6e3da" />
<RoundedFurniturePanel size={[1.6,.22,2]} position={[0,.45,0]} color="#f3f0e7" radius={.035} />
<RoundedFurniturePanel size={[1.64,.09,1.55]} position={[0,.565,.245]} color="#ded9cd" radius={.04} />
{[-.40,.40].map(x=><RoundedFurniturePanel key={x} size={[.69,.10,.43]} position={[x,.61,-.72]} color="#e7e2d6" radius={.04} />)}
</group>;
}
