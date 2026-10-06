import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const OPEN_LAPTOP_SIZE = [0.34, 0.24, 0.24] as const;
/** Static visual: no connected capability is inferred from appearance. */
export function OpenLaptop({size=OPEN_LAPTOP_SIZE}: {size?:SceneItemSize}) {
 return <group name="open-laptop" scale={[size[0]/0.34,size[1]/0.24,size[2]/0.24]}><RoundedFurniturePanel size={[.34,.018,.24]} position={[0,.009,0]} color="#474a49" radius={.005} />
<RoundedFurniturePanel size={[.34,.222,.015]} position={[0,.129,-.10]} color="#333838" radius={.004} />
<RoundedFurniturePanel size={[.318,.198,.002]} position={[0,.129,-.091]} color="#718c93" radius={.002} outline={false} />
<RoundedFurniturePanel size={[.28,.002,.09]} position={[0,.020,-.013]} color="#262b2a" radius={.001} outline={false} />
<RoundedFurniturePanel size={[.10,.002,.04]} position={[0,.020,.073]} color="#636865" radius={.001} outline={false} /></group>;
}
