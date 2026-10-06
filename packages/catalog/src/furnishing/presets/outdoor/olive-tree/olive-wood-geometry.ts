import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createOliveBranchGeometry } from "./olive-branch-geometry";
import { OLIVE_CROWN_LOBES, OLIVE_TRUNK } from "./olive-tree-structure";

export function createOliveWoodGeometry() {
  const roots = Array.from({ length: 7 }, (_, index) => {
    const angle = (index * Math.PI * 2) / 7 + 0.23;
    const reach = 0.48 + 0.09 * Math.sin(index * 3);
    return createOliveBranchGeometry(
      [
        [-0.05, 0.29, 0, 0.16],
        [Math.cos(angle) * 0.26, 0.12, Math.sin(angle) * 0.26, 0.12],
        [Math.cos(angle) * reach, 0.025, Math.sin(angle) * reach, 0.025],
      ],
      6,
      12,
      0.03,
    );
  });
  const trunkParts = [createOliveBranchGeometry(OLIVE_TRUNK, 24, 16, 0.09), ...roots];
  const boughParts = OLIVE_CROWN_LOBES.map(({ center, fork }, index) => {
    const bend = index % 2 === 0 ? -0.13 : 0.14;
    return createOliveBranchGeometry(
      [
        [...fork, 0.135],
        [
          fork[0] * 0.45 + center[0] * 0.55,
          fork[1] + 0.28,
          fork[2] * 0.45 + center[2] * 0.55,
          0.095,
        ],
        [center[0] * 0.86, center[1] - 0.21, center[2] + bend, 0.052],
        [...center, 0.016],
      ],
      12,
      12,
      0.03,
    );
  });
  const trunk = mergeGeometries(trunkParts)!;
  const boughs = mergeGeometries(boughParts)!;
  [...trunkParts, ...boughParts].forEach((geometry) => geometry.dispose());
  return { trunk, boughs };
}
