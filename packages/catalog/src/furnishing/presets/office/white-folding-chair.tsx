import { FoldingChairFrame } from "./folding-chair-frame";
import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const WHITE_FOLDING_CHAIR_SIZE = [0.46,0.8,0.52] as const;

/** Generic photo-derived proportions; no manufacturer dimensions are claimed. */
export function WhiteFoldingChair({ size = WHITE_FOLDING_CHAIR_SIZE }: { size?: SceneItemSize }) {
 return <group name="white-folding-chair" scale={[size[0]/0.46,size[1]/0.8,size[2]/0.52]} userData={{ walkCollider: true }}>
<FoldingChairFrame />
<RoundedFurniturePanel name="folding-chair-seat" size={[.46,.04,.42]} position={[0,.44,.05]} color="#eeeee7" radius={.017} />
{[.65,.73,.78].map(y=><RoundedFurniturePanel name="folding-chair-back-slat" key={y} size={[.46,.04,.035]} position={[0,y,-.175]} color="#eeeee7" radius={.01} />)}
</group>;
}
