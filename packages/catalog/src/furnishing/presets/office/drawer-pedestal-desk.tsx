import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const DRAWER_PEDESTAL_DESK_SIZE = [1.8,0.75,0.6] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function DrawerPedestalDesk({ size = DRAWER_PEDESTAL_DESK_SIZE }: { size?: SceneItemSize }) {
 return <group name="drawer-pedestal-desk" scale={[size[0]/1.8,size[1]/0.75,size[2]/0.6]} userData={{ walkCollider: true }}>
<RoundedFurniturePanel size={[1.8,.03,.6]} position={[0,.735,0]} color="#bf9663" radius={.005} />
{[-.69,.69].map(x=><group key={x}><RoundedFurniturePanel size={[.42,.72,.55]} position={[x,.36,-.025]} color="#deded7" radius={.003} />{[.09,.235,.38,.525,.66].map((y,i)=><group key={y}><RoundedFurniturePanel size={[.405,i===4?.10:.135,.025]} position={[x,y,.2625]} color="#f1f0e9" radius={.002} /><RoundedFurniturePanel size={[.14,.014,.015]} position={[x,y+.045,.2925]} color="#494945" radius={.005} outline={false} /></group>)}</group>)}
</group>;
}
