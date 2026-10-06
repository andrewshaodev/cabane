import { LatheGeometry, Vector2 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cord, DiningOakMesh, timber } from "./dining-construction";

const top = new LatheGeometry([
  [0,.728],[.571,.728],[.591,.733],[.599,.744],[.6,.752],
  [.598,.757],[.592,.761],[0,.761],
].map(p => new Vector2(...p)),64);
const members = [-1,1].flatMap(x => [-1,1].map(z =>
  timber([x*.382,0,z*.332],[x*.322,.737,z*.272],.017,.032)));
for (const s of [-1,1]) {
  members.push(timber([-.325,.696,s*.274],[.325,.696,s*.274],.027));
  members.push(timber([s*.323,.696,-.274],[s*.323,.696,.274],.027));
}
const frame = mergeGeometries(members); members.forEach(g => g.dispose());
// A handful of long, quiet grain strokes follow the timber instead of concentric rings.
const strokes = [-.42,-.29,-.13,.09,.26,.41].map((z,i) => {
  const half = Math.sqrt(.576 ** 2-z*z);
  return cord([[-half,.7622,z],[-half*.5,.7622,z+.005*Math.sin(i)],[0,.7622,z-.004],[half*.5,.7622,z+.003],[half,.7622,z]],.0006,20);
});
const grain = mergeGeometries(strokes); strokes.forEach(g => g.dispose());
export function CustomDiningTable() {
  return <group name="thin-rounded-oak-dining-table">
    <DiningOakMesh name="tapered-table-legs-and-aprons" geometry={frame} color="#af7f49" />
    <DiningOakMesh name="soft-bevel-solid-oak-top" geometry={top} color="#b48650" />
    <DiningOakMesh name="subtle-longitudinal-oak-grain" geometry={grain} color="#9e743f" outline={false} />
  </group>;
}
