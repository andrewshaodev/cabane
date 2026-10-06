import type { OliveBranchPoint } from "./olive-branch-geometry";

// Every simplified crown lobe owns a connected bough.
// Deliberate gaps between tiers preserve the exposed, open-grown silhouette.
export const OLIVE_TRUNK: readonly OliveBranchPoint[] = [
  [0, .06, 0, .36], [-.17, .45, .06, .29], [-.20, .92, -.05, .25],
  [.03, 1.38, -.02, .21], [.1, 1.72, .03, .14],
];

export const OLIVE_CROWN_LOBES = [
  { center: [-1.12, 2.22, .12], radius: [.60, .38, .54], fork: [-.1, 1.15, -.02] },
  { center: [-.76, 2.65, -.50], radius: [.62, .40, .51], fork: [.02, 1.4, -.02] },
  { center: [-.28, 2.97, -.22], radius: [.55, .42, .49], fork: [.1, 1.7, .03] },
  { center: [.48, 3.06, -.33], radius: [.61, .39, .52], fork: [.1, 1.7, .03] },
  { center: [1.03, 2.64, .02], radius: [.65, .44, .54], fork: [.02, 1.4, -.02] },
  { center: [1.18, 2.20, .55], radius: [.57, .34, .48], fork: [.02, 1.4, -.02] },
  { center: [.46, 2.46, .84], radius: [.62, .36, .53], fork: [.1, 1.7, .03] },
  { center: [-.40, 2.43, .80], radius: [.56, .38, .51], fork: [.02, 1.4, -.02] },
  { center: [-1.01, 2.27, -.75], radius: [.52, .36, .48], fork: [-.1, 1.15, -.02] },
  { center: [.05, 2.50, -1.00], radius: [.63, .35, .43], fork: [.1, 1.7, .03] },
  { center: [.82, 2.35, -.88], radius: [.53, .35, .47], fork: [.02, 1.4, -.02] },
  { center: [-.20, 2.90, .45], radius: [.51, .34, .48], fork: [.1, 1.7, .03] },
] as const;
