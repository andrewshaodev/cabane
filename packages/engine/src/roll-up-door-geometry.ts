/** Metres inside the architectural aperture; shared by the model and Walk. */
export function rollUpDoorGeometry(width: number, height: number, position: number) {
  const jambWidth = Math.min(0.055, width / 8);
  const headerHeight = Math.min(0.16, height / 8);
  const clearHeight = height - headerHeight;
  const openness = Math.max(0, Math.min(1, Number.isFinite(position) ? position : 0));
  return {
    jambWidth,
    headerHeight,
    clearWidth: width - jambWidth * 2,
    clearHeight,
    travel: clearHeight * openness,
  };
}
