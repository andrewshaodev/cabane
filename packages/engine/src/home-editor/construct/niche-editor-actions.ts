import { unusedElementId, unusedElementSerial } from "./editor-element-identity";
import type { FloorEditorAction, FloorEditorDraft } from "./draft-contract";
import {
  editorWallAttachments,
  nicheDepthLimit,
  wallNicheFromAttachment,
  type EditorNiche,
} from "./wall-attachments";
import { availableOpeningOffsetRanges, duplicateOpeningOffset } from "./opening-offsets";

/** Adapt shared opening actions to wall-owned recesses without duplicating gestures. */
export function reduceNicheOpeningAction(
  draft: FloorEditorDraft,
  action: FloorEditorAction,
): FloorEditorDraft | undefined {
  if (action.type === "add-opening" && action.kind === "niche") {
    const serial = unusedElementSerial(draft, "niche");
    const next: EditorNiche = {
      kind: "niche",
      id: `${draft.floorId}:niche-${serial}`,
      wallId: action.wallId,
      side: action.side ?? "left",
      offsetPlanUnits: action.offsetPlanUnits,
      widthPlanUnits: 0.6 / draft.coordinates.metersPerPlanUnit,
      sillHeightMeters: 0.1,
      openingHeightMeters: 1,
      depthMeters: Math.min(0.1, nicheDepthLimit(draft, action.wallId)),
    };
    const updated = storeNiche(draft, next);
    return updated === draft
      ? draft
      : { ...updated, nextSerial: serial + 1, selection: { kind: "opening", id: next.id } };
  }
  const id =
    action.type === "update-opening"
      ? action.opening.id
      : "openingId" in action
        ? action.openingId
        : undefined;
  const current = editorWallAttachments(draft).find((item) => item.id === id);
  if (current?.kind !== "niche") return undefined;
  if (action.type === "update-opening")
    return action.opening.kind === "niche" ? storeNiche(draft, action.opening) : draft;
  if (action.type === "move-opening")
    return storeNiche(draft, {
      ...current,
      wallId: action.wallId,
      offsetPlanUnits: action.offsetPlanUnits,
    });
  if (action.type === "resize-opening")
    return storeNiche(draft, { ...current, widthPlanUnits: action.widthPlanUnits });
  if (action.type === "duplicate-opening") {
    const offset = duplicateOpeningOffset(draft, current.id);
    if (offset === undefined) return draft;
    const copyId = unusedElementId(draft, `${current.id}-copy`);
    const updated = storeNiche(draft, { ...current, id: copyId, offsetPlanUnits: offset });
    return updated === draft ? draft : { ...updated, selection: { kind: "opening", id: copyId } };
  }
  if (action.type === "reorient-opening")
    return storeNiche(draft, { ...current, side: current.side === "left" ? "right" : "left" });
  return undefined;
}

function storeNiche(draft: FloorEditorDraft, requested: EditorNiche): FloorEditorDraft {
  const wall = draft.walls.find((wall) => wall.id === requested.wallId);
  if (!wall) return draft;
  const next = {
    ...requested,
    depthMeters: Math.min(requested.depthMeters, nicheDepthLimit(draft, requested.wallId)),
  };
  const finite = [
    next.offsetPlanUnits,
    next.widthPlanUnits,
    next.sillHeightMeters,
    next.openingHeightMeters,
    next.depthMeters,
  ].every(Number.isFinite);
  const fits = availableOpeningOffsetRanges({
    draft,
    wallId: next.wallId,
    widthPlanUnits: next.widthPlanUnits,
    sillHeightMeters: next.sillHeightMeters,
    excludeOpeningId: next.id,
    kind: "niche",
  }).some(({ min, max }) => next.offsetPlanUnits >= min && next.offsetPlanUnits <= max);
  if (
    !finite ||
    !fits ||
    next.widthPlanUnits <= 0 ||
    next.depthMeters < 0.01 ||
    next.sillHeightMeters < 0.012 ||
    next.openingHeightMeters <= 0 ||
    next.sillHeightMeters + next.openingHeightMeters >
      (wall.heightMeters ?? draft.defaultWallHeightMeters) - 0.002
  )
    return draft;
  return {
    ...draft,
    walls: draft.walls.map((owner) => {
      const niches = owner.niches?.filter((niche) => niche.id !== next.id) ?? [];
      if (owner.id === next.wallId)
        return { ...owner, niches: [...niches, wallNicheFromAttachment(next)] };
      return niches.length !== (owner.niches?.length ?? 0) ? { ...owner, niches } : owner;
    }),
  };
}

/** Keep blind recesses supported when their owning wall changes size. */
export function constrainWallNiches(draft: FloorEditorDraft): FloorEditorDraft {
  const walls = draft.walls.map((wall) => {
    if (!wall.niches?.length) return wall;
    const depthLimit = nicheDepthLimit(draft, wall.id);
    const thickness = depthLimit + 0.02;
    const clearance = (thickness / 2 + 0.002) / draft.coordinates.metersPerPlanUnit;
    const length = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
    const height = (wall.heightMeters ?? draft.defaultWallHeightMeters) - 0.002;
    const niches = wall.niches
      .filter(
        (niche) =>
          depthLimit >= 0.01 &&
          niche.offsetFromWallStartPlanUnits >= clearance &&
          niche.offsetFromWallStartPlanUnits + niche.widthPlanUnits <= length - clearance &&
          niche.bottomMeters + niche.heightMeters <= height,
      )
      .map((niche) =>
        niche.depthMeters > depthLimit ? { ...niche, depthMeters: depthLimit } : niche,
      );
    return niches.length === wall.niches.length &&
      niches.every((niche, index) => niche === wall.niches?.[index])
      ? wall
      : { ...wall, niches };
  });
  return walls.every((wall, index) => wall === draft.walls[index]) ? draft : { ...draft, walls };
}
