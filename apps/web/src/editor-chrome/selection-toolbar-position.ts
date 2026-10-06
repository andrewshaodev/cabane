export interface ScreenPoint {
  x: number;
  y: number;
}

export const selectionToolbarPosition = ({
  centerX,
  itemTop,
  itemBottom,
  width,
  height,
  toolbarWidth,
  toolbarHeight,
  topInset,
}: {
  centerX: number;
  itemTop: number;
  itemBottom: number;
  width: number;
  height: number;
  toolbarWidth: number;
  toolbarHeight: number;
  topInset: number;
}): ScreenPoint => {
  const margin = 8;
  const maxY = Math.max(margin, height - toolbarHeight - margin);
  const minY = Math.min(maxY, Math.max(margin, topInset));
  const above = itemTop - toolbarHeight - 18;
  return {
    x: Math.max(margin, Math.min(width - toolbarWidth - margin, centerX - toolbarWidth / 2)),
    y: Math.max(minY, Math.min(maxY, above >= minY ? above : itemBottom + 18)),
  };
};
