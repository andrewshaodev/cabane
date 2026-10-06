import { patternRandom, periodicMotif } from "./periodic-motifs";

export function paintPineBark(context: CanvasRenderingContext2D, quiet: boolean) {
  const size = context.canvas.width;
  const random = patternRandom(81731);
  context.fillStyle = "#50392b";
  context.fillRect(0, 0, size, size);
  const colors = quiet
    ? ["#89674e", "#a17a59", "#76523d"]
    : ["#916044", "#a77950", "#70472f", "#805338"];
  for (let index = 0; index < 100; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const width = size * (0.025 + random() * 0.027);
    const length = width * (1.4 + random());
    const angle = random() * Math.PI;
    periodicMotif(context, () => {
      context.translate(x, y);
      context.rotate(angle);
      context.fillStyle = colors[index % colors.length];
      context.beginPath();
      context.moveTo(-width, -length * 0.7);
      context.lineTo(-width * 0.45, -length);
      context.lineTo(width * 0.8, -length * 0.8);
      context.lineTo(width, length * 0.5);
      context.lineTo(width * 0.2, length);
      context.lineTo(-width * 0.8, length * 0.65);
      context.closePath();
      context.fill();
      context.strokeStyle = "#573b2b";
      context.lineWidth = size * 0.006;
      context.beginPath();
      context.moveTo(-width * 0.2, -length * 0.6);
      context.lineTo(width * 0.15, length * 0.55);
      context.stroke();
    });
  }
}
