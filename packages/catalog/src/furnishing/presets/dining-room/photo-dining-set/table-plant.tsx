import { CylinderGeometry, LatheGeometry, SphereGeometry, TorusGeometry, Vector2 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cord, DiningOakMesh } from "./dining-construction";

const coils = Array.from({length: 25},(_,i) => {
  const g = new TorusGeometry(.018+i*.008,.0045,5,48);
  g.rotateX(Math.PI/2); g.scale(1,1,.76); g.translate(0,.766,0); return g;
});
const mat = mergeGeometries(coils); coils.forEach(g => g.dispose());
const pot = new LatheGeometry([[0,.773],[.065,.773],[.079,.789],[.09,.893],[.094,.906],[.089,.915],[.082,.915],[.08,.895],[0,.895]].map(p=>new Vector2(...p)),32);
const ribs = Array.from({length:24},(_,i) => {
  const a = i*Math.PI/12;
  return cord([[.067*Math.cos(a),.784,.067*Math.sin(a)],[.078*Math.cos(a),.825,.078*Math.sin(a)],[.09*Math.cos(a),.902,.09*Math.sin(a)]],.003,6);
});
const flutes = mergeGeometries(ribs); ribs.forEach(g => g.dispose());
const soil = new CylinderGeometry(.081,.081,.006,24); soil.translate(0,.897,0);
const stems = [], leaves = [];
for(let i=0;i<26;i++) {
  const angle=i*2.39996, spread=.045+(i%5)*.019;
  const y=.939+(i%7)*.021;
  const x=Math.cos(angle)*spread, z=Math.sin(angle)*spread;
  stems.push(cord([[0,.899,0],[x*.45,y-.025,z*.45],[x,y,z]],.002,6));
  const leaf=new SphereGeometry(1,8,6);
  leaf.scale(.026,.006,.045); leaf.rotateX(.2+(i%4)*.23); leaf.rotateY(-angle+.5);
  leaf.translate(x,y,z); leaves.push(leaf);
}
// Upright youngest leaf fixes the retained 112 cm overall envelope.
const tip = new SphereGeometry(1,8,6); tip.scale(.019,.03,.009); tip.translate(.01,1.09,0); leaves.push(tip);
stems.push(cord([[0,.9,0],[.008,1.02,0],[.01,1.09,0]],.002,8));
const stemGeometry=mergeGeometries(stems);
const leafDark=mergeGeometries(leaves.filter((_,i)=>i%2===0));
const leafLight=mergeGeometries(leaves.filter((_,i)=>i%2===1));
[...stems,...leaves].forEach(g=>g.dispose());
export function LivingRoomTablePlant() {
  return <group name="plante-table-salon">
    <DiningOakMesh name="coiled-woven-table-mat" geometry={mat} color="#a27a43" outline={false} />
    <DiningOakMesh name="sage-ceramic-planter" geometry={pot} color="#87934d" />
    <DiningOakMesh name="vertical-planter-fluting" geometry={flutes} color="#98a15b" outline={false} />
    <DiningOakMesh name="potting-soil" geometry={soil} color="#403a25" outline={false} />
    <DiningOakMesh name="connected-plant-stems" geometry={stemGeometry} color="#48532d" outline={false} />
    <DiningOakMesh name="individual-dark-leaves" geometry={leafDark} color="#344a29" outline={false} />
    <DiningOakMesh name="individual-light-leaves" geometry={leafLight} color="#506334" outline={false} />
  </group>;
}
