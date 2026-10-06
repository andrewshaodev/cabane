/* Interaction concepts were reviewed against ai_room_planner (MIT); this
 * reducer and metre-first state contract are original to Cabane. */

import { FloorEditorDraft } from "./draft-contract";

export const availableOpeningOffsetRanges = ({
  draft,
  wallId,
  widthPlanUnits,
  excludeOpeningId,
  gapPlanUnits,
}: {
  draft: FloorEditorDraft;
  wallId: string;
  widthPlanUnits: number;
  excludeOpeningId?: string;
  gapPlanUnits?: number;
}) => {
  const resolvedGapPlanUnits = gapPlanUnits ?? .08 / draft.coordinates.metersPerPlanUnit;
  const wall = draft.walls.find((candidate) => candidate.id === wallId);
  if (!wall) return [];
  const wallLength = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
  const occupied = draft.openings
    .filter((opening) => opening.wallId === wallId && opening.id !== excludeOpeningId)
    .map((opening) => ({
      start: opening.offsetPlanUnits,
      end: opening.offsetPlanUnits + opening.widthPlanUnits,
    }))
    .sort((left, right) => left.start - right.start);
  const ranges: Array<{ min: number; max: number }> = [];
  let cursor = 0;
  for (const interval of occupied) {
    const max = interval.start - resolvedGapPlanUnits - widthPlanUnits;
    if (max >= cursor) ranges.push({ min: cursor, max });
    cursor = Math.max(cursor, interval.end + resolvedGapPlanUnits);
  }
  const finalMax = wallLength - widthPlanUnits;
  if (finalMax >= cursor) ranges.push({ min: cursor, max: finalMax });
  return ranges;
};

export const nearestAvailableOpeningOffset = (
  requested: number,
  ranges: readonly { min: number; max: number }[],
) => ranges
  .map((range) => Math.max(range.min, Math.min(range.max, requested)))
  .sort((left, right) => Math.abs(left - requested) - Math.abs(right - requested))[0];

export const duplicateOpeningOffset = (draft: FloorEditorDraft, openingId: string) => {
  const source = draft.openings.find((opening) => opening.id === openingId);
  if (!source) return undefined;
  return nearestAvailableOpeningOffset(
    source.offsetPlanUnits,
    availableOpeningOffsetRanges({
      draft,
      wallId: source.wallId,
      widthPlanUnits: source.widthPlanUnits,
    }),
  );
};
