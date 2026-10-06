import { BoxGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cord, DiningOakMesh, type Point } from "./oak-frame";

// Nested four-sided rush wraps create the characteristic diagonal envelope seams.
const wraps = Array.from({ length: 28 }, (_, i) => {
  const x = .215 - i * .0073, z = .181 - i * .0061;
  const y = .454 + .004 * Math.sin(i * .7);
  const points: Point[] = [[-x,y,-z],[0,y,-z],[x,y,-z],[x,y,0],[x,y,z],[0,y,z],[-x,y,z],[-x,y,0],[-x,y,-z]];
  return cord(points,.0038,32);
});
const core = new BoxGeometry(.416, .018, .358);
core.translate(0, .442, 0);
const even = mergeGeometries([core, ...wraps.filter((_, i) => i % 2 === 0)]);
core.dispose();
const odd = mergeGeometries(wraps.filter((_, i) => i % 2 === 1));
wraps.forEach(g => g.dispose());
export function WovenDiningSeat() {
  return <group name="envelope-woven-rush-seat">
    <DiningOakMesh name="rush-natural" geometry={even} color="#b58e56" outline={false} />
    <DiningOakMesh name="rush-light" geometry={odd} color="#c5a36d" outline={false} />
  </group>;
}
