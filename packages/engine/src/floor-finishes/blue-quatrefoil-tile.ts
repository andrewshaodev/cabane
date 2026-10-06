/** Cream quatrefoils outlined in slate blue, on 20 cm square tiles. */
export function paintBlueQuatrefoilTile(context: CanvasRenderingContext2D, quiet: boolean) {
  const cell = context.canvas.width / 2;
  const light = quiet ? "#e2e4dc" : "#eeeee2",
    blue = quiet ? "#94a6a7" : "#78959d";
  context.fillStyle = "#b8b7aa";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  const flower = () => {
    context.beginPath();
    context.moveTo(0.5, 0.08);
    context.bezierCurveTo(0.7, 0.08, 0.74, 0.26, 0.67, 0.33);
    context.bezierCurveTo(0.74, 0.26, 0.92, 0.3, 0.92, 0.5);
    context.bezierCurveTo(0.92, 0.7, 0.74, 0.74, 0.67, 0.67);
    context.bezierCurveTo(0.74, 0.74, 0.7, 0.92, 0.5, 0.92);
    context.bezierCurveTo(0.3, 0.92, 0.26, 0.74, 0.33, 0.67);
    context.bezierCurveTo(0.26, 0.74, 0.08, 0.7, 0.08, 0.5);
    context.bezierCurveTo(0.08, 0.3, 0.26, 0.26, 0.33, 0.33);
    context.bezierCurveTo(0.26, 0.26, 0.3, 0.08, 0.5, 0.08);
    context.closePath();
    context.fill();
  };
  for (let row = 0; row < 2; row++)
    for (let column = 0; column < 2; column++) {
      context.save();
      context.translate(column * cell, row * cell);
      context.scale(cell, cell);
      context.fillStyle = blue;
      context.fillRect(0.006, 0.006, 0.988, 0.988);
      context.save();
      context.translate(0.5, 0.5);
      context.scale(1.1, 1.1);
      context.translate(-0.5, -0.5);
      context.fillStyle = light;
      flower();
      context.restore();
      context.fillStyle = light;
      for (const [x, y] of [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x === 0 ? 0.1 : 0.9, y);
        context.lineTo(x, y === 0 ? 0.1 : 0.9);
        context.closePath();
        context.fill();
      }
      context.fillStyle = blue;
      context.beginPath();
      context.moveTo(0.5, 0.462);
      context.lineTo(0.538, 0.5);
      context.lineTo(0.5, 0.538);
      context.lineTo(0.462, 0.5);
      context.closePath();
      context.fill();
      context.restore();
    }
}
