import type { EditorWallAttachment } from "@cabane/engine";

export function previewWallAttachments(
  attachments: readonly EditorWallAttachment[],
  draggingOpening: { openingId: string; wallId: string; offsetPlanUnits: number } | null,
  resizingOpening: { openingId: string; offsetPlanUnits: number; widthPlanUnits: number } | null,
) {
  return attachments.map((opening) =>
    draggingOpening?.openingId === opening.id
      ? {
          ...opening,
          wallId: draggingOpening.wallId,
          offsetPlanUnits: draggingOpening.offsetPlanUnits,
        }
      : resizingOpening?.openingId === opening.id
        ? {
            ...opening,
            offsetPlanUnits: resizingOpening.offsetPlanUnits,
            widthPlanUnits: resizingOpening.widthPlanUnits,
          }
        : opening,
  );
}
