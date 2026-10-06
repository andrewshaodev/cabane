/** Seamlessly repeating wood boards, generated locally without image assets. */
export const paintWoodPlanks = (
  context: CanvasRenderingContext2D,
  quiet: boolean,
  species: "walnut" | "oak",
  horizontal = false,
) => {
  const base = species === "oak" ? [201, 169, 126] : [119, 88, 63];
  const size = context.canvas.width;
  const boards = 16;
  const width = size / boards;
  const tau = Math.PI * 2;
  const hash = (value: number) => {
    const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  for (let x = 0; x < size; x += 1) {
    const board = Math.floor(x / width);
    const across = (x / width) % 1;
    const offset = hash(board + 17);
    const split = 0.42 + hash(board + 73) * 0.18;
    for (let y = 0; y < size; y += 1) {
      const along = (y / size + offset) % 1;
      const segment = along < split ? 0 : 1;
      const seed = board * 7 + segment * 137;
      const phase = hash(seed + 91) * tau;
      // Slow curving fibers and finer pores run along each board. Periodic
      // waves meet at the repeat; their phase changes only at actual end joints.
      const bend = Math.sin(along * tau + phase) * 0.16;
      const fiber = Math.sin((across * 6 + bend) * tau + phase);
      const fine = Math.sin((across * 12 + bend * 2) * tau + phase);
      const figure = Math.sin(across * 5 + Math.sin(along * tau + phase) * 1.4);
      const variation = (hash(seed + 3) - 0.5) * 17;
      const grain = fiber * 2.1 + fine * 1.1 + figure * 3.3;
      const pore = (hash(x * 101 + y * 31) - 0.5) * 2;
      const edgeDistance = Math.min(across, 1 - across) * width;
      const endDistance = Math.min(along, 1 - along, Math.abs(along - split)) * size;
      // Fine, low-contrast joints stay quiet in overview instead of black stripes.
      const seam = Math.max(0, 1 - Math.min(edgeDistance, endDistance) / (size * 0.0007));
      const tone = variation + grain * (quiet ? 0.45 : 1) + pore - seam * 13;
      context.fillStyle = `rgb(${Math.round(base[0] + tone)}, ${Math.round(base[1] + tone * 0.85)}, ${Math.round(base[2] + tone * 0.7)})`;
      context.fillRect(horizontal ? y : x, horizontal ? x : y, 1, 1);
    }
  }
};
