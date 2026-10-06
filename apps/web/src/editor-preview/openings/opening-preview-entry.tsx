import { DoorModel, WindowModel } from "@cabane/catalog/architecture";
import type {
  HomeBindingManifest,
  FloorSpec,
  OpeningSpec,
  WallSpec,
  HomeOpeningModelComponent,
} from "@cabane/engine";
import type { ModelPreviewEntry } from "../furnish/catalog/model-preview-entry";

/** Isolate the actual opening at the preview origin; reuse its procedural scene model. */
export function openingPreviewEntry(
  manifest: HomeBindingManifest,
  openingId: string,
): ModelPreviewEntry | null {
  const floor = manifest.floors.find((floor) =>
    floor.openings.some((opening) => opening.id === openingId),
  );
  const source = floor?.openings.find((opening) => opening.id === openingId);
  const sourceWall = floor?.walls.find((wall) => wall.id === source?.wallId);
  if (!floor || !source || !sourceWall || source.kind === "passage") return null;
  const extension = source.visualModel
    ? manifest.extensions.openingModels[source.visualModel]
    : undefined;
  return architecturalOpeningPreview(source, floor, sourceWall, extension);
}

export function architecturalOpeningPreview(
  source: Exclude<OpeningSpec, { kind: "passage" }>,
  floor: FloorSpec,
  sourceWall: WallSpec,
  extension?: HomeOpeningModelComponent,
): ModelPreviewEntry {
  const width = source.widthPlanUnits * floor.coordinates.metersPerPlanUnit;
  const opening = {
    ...source,
    offsetFromWallStartPlanUnits: 0,
    widthPlanUnits: width,
    sillHeightMeters: 0,
  };
  const wall = { ...sourceWall, from: [0, 0] as const, to: [width, 0] as const };
  const previewFloor = {
    ...floor,
    coordinates: { ...floor.coordinates, origin: [0, 0] as const, metersPerPlanUnit: 1 },
  };
  const rail =
    opening.kind === "door" && opening.operation === "sliding" && opening.variant === "plank";
  const depth = wall.thicknessMeters / 2 + 0.18;
  return {
    key: `opening:${JSON.stringify([opening, wall.thicknessMeters, wall.exteriorColor, wall.faceColors, wall.edgeColor])}`,
    kind: "procedural",
    definition: {
      bounds: {
        min: [rail ? -width : -0.1, -0.08, -depth],
        max: [rail ? width * 2 : width + 0.1, opening.openingHeightMeters + 0.15, depth],
      },
      component: () => {
        const props = { wall, floor: previewFloor, position: 0, reducedMotion: true };
        if (extension) {
          const Model = extension;
          return <Model {...props} opening={opening} />;
        }
        return opening.kind === "door" ? (
          <DoorModel {...props} opening={opening} />
        ) : (
          <WindowModel {...props} opening={opening} />
        );
      },
    },
  };
}
