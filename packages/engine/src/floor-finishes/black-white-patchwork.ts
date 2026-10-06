/** Four repeating geometric tile motifs, on a 4 x 4 grid of 20 cm squares. */
export function paintBlackWhitePatchwork(context: CanvasRenderingContext2D, quiet: boolean) {
  const cell = context.canvas.width / 4;
  const light = quiet ? "#e5e2d8" : "#ece9df";
  const dark = quiet ? "#656b68" : "#252c29";
  context.fillStyle = "#b8b5a9";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 4; column++) {
      context.save();
      context.translate((column + 0.5) * cell, (row + 0.5) * cell);
      context.rotate((((column + row) % 4) * Math.PI) / 2);
      const edge = cell * 0.492;
      context.fillStyle = light;
      context.fillRect(-edge, -edge, edge * 2, edge * 2);
      context.fillStyle = dark;
      switch ((column + row * 3) % 4) {
        case 0:
          // Alternating diagonal halves.
          context.beginPath();
          context.moveTo(-edge, -edge);
          context.lineTo(edge, -edge);
          context.lineTo(-edge, edge);
          context.closePath();
          context.fill();
          break;
        case 1:
          // Four curved corner wedges surrounding a pale diamond.
          for (const [x, y] of [
            [-edge, -edge],
            [edge, -edge],
            [edge, edge],
            [-edge, edge],
          ]) {
            context.beginPath();
            context.moveTo(x, y);
            context.quadraticCurveTo(0, 0, x === -edge ? edge : -edge, y);
            context.quadraticCurveTo(0, 0, x, y === -edge ? edge : -edge);
            context.closePath();
            context.fill();
          }
          break;
        case 2:
          // A quarter-circle band; adjacent rotated tiles make larger arcs.
          context.beginPath();
          context.arc(-edge, -edge, edge * 2, 0, Math.PI / 2);
          context.arc(-edge, -edge, edge * 1.36, Math.PI / 2, 0, true);
          context.closePath();
          context.fill();
          break;
        case 3:
          // Four-point star.
          context.beginPath();
          for (let point = 0; point < 8; point++) {
            const radius = point % 2 === 0 ? edge : edge * 0.3;
            const angle = (point * Math.PI) / 4;
            const x = Math.cos(angle) * radius,
              y = Math.sin(angle) * radius;
            if (point === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.closePath();
          context.fill();
      }
      context.restore();
    }
  }
}
