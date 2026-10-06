import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const KNOB_DOOR_WARDROBE_SIZE = [1.0,2.4,0.6] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function KnobDoorWardrobe({ size = KNOB_DOOR_WARDROBE_SIZE }: { size?: SceneItemSize }) {
 return <group name="knob-door-wardrobe" scale={[size[0]/1.0,size[1]/2.4,size[2]/0.6]} userData={{ walkCollider: true }}>
<RoundedFurniturePanel size={[1,2.4,.54]} position={[0,1.2,-.03]} color="#dcd9d1" />
{[-.25,.25].map((x,i)=><group key={x}><RoundedFurniturePanel size={[.494,2.34,.025]} position={[x,1.23,.2525]} color="#e7e4dc" radius={.003} /><mesh position={[i===0?-.025:.025,1.05,.28]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.018,.018,.04,16]} /><ToonMaterial color="#302e2a" /></mesh></group>)}
</group>;
}
