/** Bundled, generated gouache prints; no household data or external image service. */
const WALL_ART_IMAGES = {
  "atlantic-village": new URL("../../../../assets/wall-art/atlantic-village.png", import.meta.url)
    .href,
  "riviera-cliffs": new URL("../../../../assets/wall-art/riviera-cliffs.png", import.meta.url).href,
  "breton-harbor": new URL("../../../../assets/wall-art/breton-harbor.png", import.meta.url).href,
  "provence-village": new URL("../../../../assets/wall-art/provence-village.png", import.meta.url)
    .href,

  olive: new URL("../../../../assets/wall-art/olive-jug.png", import.meta.url).href,
  lemons: new URL("../../../../assets/wall-art/lemons-bowl.png", import.meta.url).href,
  figs: new URL("../../../../assets/wall-art/fig-study.png", import.meta.url).href,
  pottery: new URL("../../../../assets/wall-art/pottery-vases.png", import.meta.url).href,
  rosemary: new URL("../../../../assets/wall-art/rosemary-pitcher.png", import.meta.url).href,
} as const;

export function wallArtImage(variant: string): string | undefined {
  // Preserve the three botanical variant IDs already used by saved projects.
  if (variant === "fern") return WALL_ART_IMAGES.rosemary;
  if (variant === "clay") return WALL_ART_IMAGES.pottery;
  return Object.hasOwn(WALL_ART_IMAGES, variant)
    ? WALL_ART_IMAGES[variant as keyof typeof WALL_ART_IMAGES]
    : undefined;
}
