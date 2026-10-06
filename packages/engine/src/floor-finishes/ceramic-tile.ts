/** Repeating ceramic layouts with visible neutral grout and flat tile colors. */
export const paintCeramicTile = (
  context: CanvasRenderingContext2D,
  pattern: "square-tile" | "subway-tile" | "checkerboard-tile",
  color: string,
) => {
  const size = context.canvas.width;
  const columns = pattern === "subway-tile" ? 2 : 4;
  const rows = 4;
  const width = size / columns;
  const height = size / rows;
  const grout = size / 96;
  context.fillStyle = "#99978f";
  context.fillRect(0, 0, size, size);
  for (let row = 0; row < rows; row += 1) {
    const offset = pattern === "subway-tile" && row % 2 ? width / 2 : 0;
    for (let column = -1; column < columns; column += 1) {
      context.fillStyle =
        pattern === "checkerboard-tile" && (row + column) % 2 === 0 ? "#f2eee4" : color;
      context.fillRect(
        column * width + offset + grout,
        row * height + grout,
        width - grout * 2,
        height - grout * 2,
      );
    }
  }
};
