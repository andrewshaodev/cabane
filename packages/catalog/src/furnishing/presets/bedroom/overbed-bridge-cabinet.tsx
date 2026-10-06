import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OVERBED_BRIDGE_CABINET_SIZE = [2,0.65,0.4] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function OverbedBridgeCabinet({ size = OVERBED_BRIDGE_CABINET_SIZE }: { size?: SceneItemSize }) {
 return <group name="overbed-bridge-cabinet" scale={[size[0]/2,size[1]/0.65,size[2]/0.4]}>
<RoundedFurniturePanel size={[2,.65,.36]} position={[0,.325,-.02]} color="#dcd9d1" />
{[-.75,-.25,.25,.75].map((x,i)=><group key={x}><RoundedFurniturePanel size={[.494,.61,.025]} position={[x,.335,.1725]} color="#e7e4dc" radius={.003} /><mesh position={[x+(i%2===0?.20:-.20),.10,.19]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.015,.015,.02,16]} /><ToonMaterial color="#302e2a" /></mesh></group>)}
</group>;
}
