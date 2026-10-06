import { periodicMotif } from "./periodic-motifs";

export function paintTomettes(context: CanvasRenderingContext2D, quiet: boolean) {
  const size = context.canvas.width;
  context.fillStyle = "#a08c73";
  context.fillRect(0, 0, size, size);
  const colors = quiet
    ? ["#c18565", "#ba7a5b", "#c58b6b", "#b87d60"]
    : ["#b66b4b", "#ad6043", "#c17a54", "#b97151"];
  // Four columns and four staggered rows close exactly at each repeat edge.
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      const x = (column * size) / 4;
      const y = ((row + (column % 2) * 0.5) * size) / 4;
      context.fillStyle = colors[(column * 3 + row) % colors.length];
      periodicMotif(context, () => {
        context.beginPath();
        for (let corner = 0; corner < 6; corner += 1) {
          const angle = (corner * Math.PI) / 3;
          const px = x + ((Math.cos(angle) * size) / 6) * 0.96;
          const py = y + ((Math.sin(angle) * size) / (4 * Math.sqrt(3))) * 0.96;
          if (corner === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        }
        context.closePath();
        context.fill();
      });
    }
  }
}
