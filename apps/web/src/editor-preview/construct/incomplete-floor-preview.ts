import type { FloorEditorDraft, FloorSpec } from "@cabane/engine";

/** An open wall graph must not keep the rooms from its last closed shape. */
export function incompleteFloorPreview(draft: FloorEditorDraft, previous: FloorSpec): FloorSpec {
  return {
    ...previous,
    id: draft.floorId,
    name: draft.floorName,
    floorToFloorHeightMeters: draft.floorToFloorHeightMeters ?? previous.floorToFloorHeightMeters,
    coordinates: draft.coordinates,
    defaultWallHeightMeters: draft.defaultWallHeightMeters,
    defaultCeilingHeightMeters: draft.defaultCeilingHeightMeters,
    footprint: [], footprintRegions: [], rooms: [], ceilings: [],
    walls: draft.walls.map(wall => ({ ...wall, classification: "exterior" as const,
      thicknessMeters: wall.thicknessMeters ?? draft.exteriorWallThicknessMeters })),
    wallJunctions: draft.junctions,
    openings: draft.openings.map(({ offsetPlanUnits, ...opening }) => ({
      ...opening, offsetFromWallStartPlanUnits: offsetPlanUnits,
    })),
    ...(draft.hedges ? { hedges: draft.hedges } : {}),
    ...(draft.outdoorPlatforms ? { outdoorPlatforms: draft.outdoorPlatforms } : {}),
    ...(draft.pools ? { pools: draft.pools } : {}),
    ...(draft.groundZones ? { groundZones: draft.groundZones } : {}),
  };
}
