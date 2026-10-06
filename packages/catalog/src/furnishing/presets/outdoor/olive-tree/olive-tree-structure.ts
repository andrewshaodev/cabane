import type { OliveBranchPoint } from "./olive-branch-geometry";

// Every simplified crown lobe owns a connected bough.
// Deliberate gaps between tiers preserve the exposed, open-grown silhouette.
export const OLIVE_TRUNK: readonly OliveBranchPoint[] = [
  [0, 0.06, 0, 0.36],
  [-0.17, 0.45, 0.06, 0.29],
  [-0.2, 0.92, -0.05, 0.25],
  [0.03, 1.38, -0.02, 0.21],
  [0.1, 1.72, 0.03, 0.14],
];

export const OLIVE_CROWN_LOBES = [
  { center: [-1.12, 2.22, 0.12], radius: [0.6, 0.38, 0.54], fork: [-0.1, 1.15, -0.02] },
  { center: [-0.76, 2.65, -0.5], radius: [0.62, 0.4, 0.51], fork: [0.02, 1.4, -0.02] },
  { center: [-0.28, 2.97, -0.22], radius: [0.55, 0.42, 0.49], fork: [0.1, 1.7, 0.03] },
  { center: [0.48, 3.06, -0.33], radius: [0.61, 0.39, 0.52], fork: [0.1, 1.7, 0.03] },
  { center: [1.03, 2.64, 0.02], radius: [0.65, 0.44, 0.54], fork: [0.02, 1.4, -0.02] },
  { center: [1.18, 2.2, 0.55], radius: [0.57, 0.34, 0.48], fork: [0.02, 1.4, -0.02] },
  { center: [0.46, 2.46, 0.84], radius: [0.62, 0.36, 0.53], fork: [0.1, 1.7, 0.03] },
  { center: [-0.4, 2.43, 0.8], radius: [0.56, 0.38, 0.51], fork: [0.02, 1.4, -0.02] },
  { center: [-1.01, 2.27, -0.75], radius: [0.52, 0.36, 0.48], fork: [-0.1, 1.15, -0.02] },
  { center: [0.05, 2.5, -1.0], radius: [0.63, 0.35, 0.43], fork: [0.1, 1.7, 0.03] },
  { center: [0.82, 2.35, -0.88], radius: [0.53, 0.35, 0.47], fork: [0.02, 1.4, -0.02] },
  { center: [-0.2, 2.9, 0.45], radius: [0.51, 0.34, 0.48], fork: [0.1, 1.7, 0.03] },
] as const;
