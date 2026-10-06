export interface SceneRenderingQuality {
  dpr: [minimum: number, maximum: number];
  shadowMapSize: 1024 | 2048;
  antialias: boolean;
}

export const sceneRenderingQuality = (
  coarsePointer: boolean,
  walkMode: boolean,
  qualityTier: 0 | 1 | 2,
): SceneRenderingQuality => {
  if (!coarsePointer) {
    return { dpr: [1.25, 2], shadowMapSize: 2048, antialias: true };
  }
  if (!walkMode) {
    return { dpr: [0.75, 1.25], shadowMapSize: 1024, antialias: true };
  }
  if (qualityTier === 2) {
    return { dpr: [0.85, 1.25], shadowMapSize: 1024, antialias: true };
  }
  if (qualityTier === 1) {
    return { dpr: [0.75, 1], shadowMapSize: 1024, antialias: true };
  }
  return { dpr: [0.65, 0.85], shadowMapSize: 1024, antialias: true };
};

export const foregroundRenderingDpr = (
  quality: SceneRenderingQuality,
): [minimum: number, maximum: number] => [
  Math.max(1, quality.dpr[0]),
  Math.max(1.25, quality.dpr[1]),
];
