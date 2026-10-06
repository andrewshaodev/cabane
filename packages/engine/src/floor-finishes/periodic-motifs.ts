/** Draw edge-crossing motifs on every adjacent tile for seamless repetition. */
export function periodicMotif(context: CanvasRenderingContext2D, paint: () => void) {
  const size = context.canvas.width;
  for (const x of [-size, 0, size]) {
    for (const y of [-size, 0, size]) {
      context.save();
      context.translate(x, y);
      paint();
      context.restore();
    }
  }
}

export function patternRandom(seed: number) {
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
}
