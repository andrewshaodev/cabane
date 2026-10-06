import { patternRandom, periodicMotif } from "./periodic-motifs";

export function paintDirt(context: CanvasRenderingContext2D, dark: boolean, quiet: boolean) {
  const size = context.canvas.width;
  const random = patternRandom(21931);
  context.fillStyle = dark ? "#65503d" : "#ab8962";
  context.fillRect(0, 0, size, size);
  for (let index = 0; index < 360; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = size * (0.002 + random() * 0.009);
    context.fillStyle = index % 2 ? "rgba(36, 24, 16, 0.13)" : "rgba(225, 199, 153, 0.18)";
    context.globalAlpha = quiet ? 0.65 : 1;
    periodicMotif(context, () => {
      context.beginPath();
      context.ellipse(x, y, radius * 1.4, radius, 0, 0, Math.PI * 2);
      context.fill();
    });
  }
  context.globalAlpha = 1;
}
