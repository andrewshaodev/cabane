import type { BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { bentwood, cord, DiningOakMesh, timber, WovenDiningSeat } from "./dining-construction";

const members: BufferGeometry[] = [-1, 1].flatMap(s => [
  timber([s*.222,0,.182],[s*.211,.671,.13],.013,.019),
  timber([s*.205,0,-.181],[s*.191,.748,-.174],.013,.021),
  timber([s*.205,.425,-.168],[s*.216,.425,.171],.019),
  timber([s*.212,.235,-.166],[s*.216,.235,.163],.011),
]);
members.push(
  timber([-.213,.425,.171],[.213,.425,.171],.021),
  timber([-.201,.425,-.168],[.201,.425,-.168],.018),
  timber([-.212,.255,-.166],[.212,.255,-.166],.011),
  cord([[0,.442,-.17],[0,.574,-.187],[-.048,.67,-.2],[-.104,.754,-.202]],.013,14),
  cord([[0,.568,-.187],[.048,.67,-.2],[.104,.754,-.202]],.013,10),
);
const frame = mergeGeometries(members); members.forEach(g => g.dispose());
const rail = bentwood();

export function CustomDiningChair({ position, rotationY }: {
  readonly position: readonly [number, number, number]; readonly rotationY: number;
}) {
  return <group name="chaise-repas-cannee-custom" position={position} rotation={[0,rotationY,0]}>
    <DiningOakMesh name="wishbone-chair-joined-frame" geometry={frame} />
    <DiningOakMesh name="continuous-bentwood-back-and-arms" geometry={rail} color="#cba16b" />
    <WovenDiningSeat />
  </group>;
}
