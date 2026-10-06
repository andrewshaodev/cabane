import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const SHELF_HEADBOARD_SIZE = [2,1.15,0.22] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function ShelfHeadboard({ size = SHELF_HEADBOARD_SIZE }: { size?: SceneItemSize }) {
 return <group name="shelf-headboard" scale={[size[0]/2,size[1]/1.15,size[2]/0.22]} userData={{ walkCollider: true }}>
<RoundedFurniturePanel size={[2,1.125,.05]} position={[0,.5625,-.085]} color="#bd976d" />
<RoundedFurniturePanel size={[2,.025,.22]} position={[0,1.1375,0]} color="#c5a47a" />
<RoundedFurniturePanel size={[1.58,.72,.025]} position={[0,.43,-.0475]} color="#efeee8" radius={.004} />
{[-.90,.90].map(x=><RoundedFurniturePanel key={x} size={[.17,.025,.16]} position={[x,.30,.025]} color="#c5a47a" />)}
</group>;
}
