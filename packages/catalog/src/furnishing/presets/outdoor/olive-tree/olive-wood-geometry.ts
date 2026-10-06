import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createOliveBranchGeometry } from "./olive-branch-geometry";
import { OLIVE_CROWN_LOBES, OLIVE_TRUNK } from "./olive-tree-structure";

export function createOliveWoodGeometry() {
  const roots = Array.from({ length: 7 }, (_, index) => {
    const angle = index * Math.PI * 2 / 7 + .23;
    const reach = .48 + .09 * Math.sin(index * 3);
    return createOliveBranchGeometry([
      [-.05, .29, 0, .16],
      [Math.cos(angle) * .26, .12, Math.sin(angle) * .26, .12],
      [Math.cos(angle) * reach, .025, Math.sin(angle) * reach, .025],
    ], 6, 12, .03);
  });
  const trunkParts = [createOliveBranchGeometry(OLIVE_TRUNK, 24, 16, .09), ...roots];
  const boughParts = OLIVE_CROWN_LOBES.map(({ center, fork }, index) => {
    const bend = index % 2 === 0 ? -.13 : .14;
    return createOliveBranchGeometry([
      [...fork, .135],
      [fork[0] * .45 + center[0] * .55, fork[1] + .28, fork[2] * .45 + center[2] * .55, .095],
      [center[0] * .86, center[1] - .21, center[2] + bend, .052],
      [...center, .016],
    ], 12, 12, .03);
  });
  const trunk = mergeGeometries(trunkParts)!;
  const boughs = mergeGeometries(boughParts)!;
  [...trunkParts, ...boughParts].forEach((geometry) => geometry.dispose());
  return { trunk, boughs };
}
