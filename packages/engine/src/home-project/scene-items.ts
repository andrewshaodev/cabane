import { roomsForFloor } from "../outdoor-platforms/platform-rooms";
import { pointOnFloorSupport } from "../outdoor-platforms/platform-geometry";
import { modelVariants } from "../model-variants";
import { GROUND_ELEVATION_METERS } from "../ground-elevation";
import { pointInsidePolygon, worldPointToPlan } from "../geometry";
import { pointStrictlyOutsideFloorFootprint } from "../floor-finishes/finish-geometry";
import type { ProjectModelRegistries, SceneModelEditorDescriptor } from "../types";
import { resolveItemTransform } from "./placements";
import { validateDeviceSlotsAgainstModel } from "./profiles";
import type { HomeProject, SceneItemSpec } from "./types";
import { addProjectIssue, addProjectWarning, type HomeProjectIssue } from "./validation-types";

const roomIdsForItem = (item: SceneItemSpec, project: HomeProject): readonly string[] => {
  const floor = project.floors.find((candidate) => candidate.id === item.floorId);
  if (!floor) return [];
  const transform = resolveItemTransform(item.placement, floor);
  const at = worldPointToPlan(
    { x: transform.position[0], z: transform.position[2] },
    floor.coordinates,
  );
  return roomsForFloor(floor)
    .filter((room) => pointInsidePolygon(at, room.polygon))
    .map((room) => room.id);
};

export const resolvedRoomIdForItem = (item: SceneItemSpec, project: HomeProject): string | null => {
  const roomIds = roomIdsForItem(item, project);
  if (roomIds.length !== 1) return null;
  if (item.placement.kind === "ceiling" && roomIds[0] !== item.placement.roomId) return null;
  return roomIds[0];
};

const validatePlacementBounds = (
  item: SceneItemSpec,
  index: number,
  project: HomeProject,
  issues: HomeProjectIssue[],
  definition: SceneModelEditorDescriptor | undefined,
) => {
  const floor = project.floors.find((candidate) => candidate.id === item.floorId);
  if (!floor) return;
  const path = `sceneItems[${index}].placement`;
  const placement = item.placement;
  if (placement.kind === "absolute") {
    if (
      floor.id !== project.floors.find((floor) => !floor.belowGround)?.id &&
      !pointOnFloorSupport(placement.at, floor)
    )
      addProjectIssue(
        issues,
        "project.item-support",
        path,
        "Place the item on a room floor or outdoor platform.",
      );
    const onOutdoorGround =
      !floor.outdoorPlatforms?.some((p) => pointInsidePolygon(placement.at, p.polygon)) &&
      floor.id === project.floors.find((floor) => !floor.belowGround)?.id &&
      pointStrictlyOutsideFloorFootprint(placement.at, floor);
    const minimumElevation = onOutdoorGround ? GROUND_ELEVATION_METERS : 0;
    if (placement.elevationMeters < minimumElevation) {
      addProjectIssue(
        issues,
        "project.item-elevation",
        `${path}.elevationMeters`,
        `Absolute item elevation cannot be below its ${minimumElevation} metre ground datum.`,
      );
    }
    return;
  }
  if (placement.kind === "wall") {
    const wall = floor.walls.find((candidate) => candidate.id === placement.wallId);
    if (!wall) return;
    const wallLength = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
    if (
      placement.offsetFromWallStartPlanUnits < 0 ||
      placement.offsetFromWallStartPlanUnits > wallLength
    ) {
      addProjectIssue(
        issues,
        "project.wall-support-span",
        `${path}.offsetFromWallStartPlanUnits`,
        `Wall attachment must remain within wall “${wall.id}”.`,
      );
    }
    const wallHeight = wall.heightMeters ?? floor.defaultWallHeightMeters;
    const heightScale = definition ? item.size[1] / definition.defaultSize[1] : 1;
    // Hanging models extend below their anchor. Keep the existing size-based
    // envelope for floor-origin models while accounting for that lower origin.
    const bottom =
      placement.elevationMeters + Math.min(0, definition?.bounds.min[1] ?? 0) * heightScale;
    const top = bottom + item.size[1];
    if (placement.elevationMeters < 0 || bottom < -1e-8 || top > wallHeight + 1e-8) {
      addProjectIssue(
        issues,
        "project.wall-support-height",
        `${path}.elevationMeters`,
        `Wall attachment must fit between the floor and ${wallHeight} metres.`,
      );
    }
    return;
  }
  const ceiling = floor.ceilings?.find((candidate) => candidate.roomIds.includes(placement.roomId));
  const height = ceiling?.kind === "flat" ? ceiling.heightMeters : floor.defaultCeilingHeightMeters;
  if (placement.dropMeters < 0 || placement.dropMeters > height) {
    addProjectIssue(
      issues,
      "project.ceiling-drop",
      `${path}.dropMeters`,
      `Ceiling drop must be between zero and ${height} metres.`,
    );
  }
};

export const validateSceneItemsAndSupports = (
  project: HomeProject,
  registries: ProjectModelRegistries,
  issues: HomeProjectIssue[],
) => {
  project.sceneItems.forEach((item, index) => {
    const itemPath = `sceneItems[${index}]`;
    const floor = project.floors.find((candidate) => candidate.id === item.floorId);
    if (!floor) {
      addProjectIssue(
        issues,
        "project.item-floor-missing",
        `${itemPath}.floorId`,
        "The item floor does not exist.",
      );
      return;
    }
    const placement = item.placement;
    const registry = item.kind === "device" ? registries.deviceModels : registries.furnishingModels;
    const definition = Object.hasOwn(registry, item.modelId) ? registry[item.modelId] : undefined;
    if (!definition) {
      addProjectWarning(
        issues,
        "project.model-missing",
        `${itemPath}.modelId`,
        `Model “${item.modelId}” is not registered; a generic placeholder will be shown until it is imported.`,
      );
    } else {
      if (
        item.lightSlotId &&
        (!definition.lighting ||
          (item.kind === "device" &&
            item.entitySlots.some(
              (slot) => slot.deviceRole === "primary" && slot.compatibleDomains.includes("light"),
            )))
      )
        addProjectIssue(
          issues,
          "project.light-relationship",
          `${itemPath}.lightSlotId`,
          "An independent lighting relationship requires model lighting and no existing primary light slot.",
        );
      if (
        item.variant !== undefined &&
        !modelVariants(definition).some((variant) => variant.id === item.variant)
      ) {
        addProjectWarning(
          issues,
          "project.variant-missing",
          `${itemPath}.variant`,
          `Variant “${item.variant}” is not available for model “${item.modelId}”; its default variant will be shown until it is available.`,
        );
      }
      if (
        item.modelId.startsWith("custom:") &&
        item.size.some(
          (dimension, axis) =>
            Math.abs(
              dimension / definition.defaultSize[axis] - item.size[0] / definition.defaultSize[0],
            ) > 0.000001,
        )
      ) {
        addProjectIssue(
          issues,
          "project.custom-model-scale",
          `${itemPath}.size`,
          "Imported models use uniform scaling. Restore matching proportions.",
        );
      }
      if (item.kind === "device")
        validateDeviceSlotsAgainstModel(
          item,
          definition as ProjectModelRegistries["deviceModels"][string],
          index,
          issues,
        );
    }

    let supportExists = true;
    if (placement.kind === "wall" && !floor.walls.some((wall) => wall.id === placement.wallId)) {
      supportExists = false;
      addProjectIssue(
        issues,
        "project.wall-support-missing",
        `${itemPath}.placement.wallId`,
        `Wall “${placement.wallId}” does not exist.`,
      );
    }
    if (placement.kind === "ceiling" && !floor.rooms.some((room) => room.id === placement.roomId)) {
      addProjectIssue(
        issues,
        "project.ceiling-room-missing",
        `${itemPath}.placement.roomId`,
        `Room “${placement.roomId}” does not exist.`,
      );
    }
    item.size.forEach((value, axis) => {
      if (!Number.isFinite(value) || value <= 0) {
        addProjectIssue(
          issues,
          "project.item-size",
          `${itemPath}.size[${axis}]`,
          "Item dimensions must be positive finite metres.",
        );
      }
    });
    validatePlacementBounds(item, index, project, issues, definition);
    if (!supportExists) return;

    const roomIds = roomIdsForItem(item, project);
    if (definition?.placementEnvironment === "outdoor") {
      const transform = resolveItemTransform(item.placement, floor);
      const at =
        item.placement.kind === "absolute"
          ? item.placement.at
          : worldPointToPlan(
              {
                x: transform.position[0],
                z: transform.position[2],
              },
              floor.coordinates,
            );
      if (
        item.placement.kind !== "absolute" ||
        (!floor.outdoorPlatforms?.some((p) => pointInsidePolygon(at, p.polygon)) &&
          !pointStrictlyOutsideFloorFootprint(at, floor))
      ) {
        addProjectIssue(
          issues,
          "project.outdoor-placement",
          `${itemPath}.placement`,
          "Outdoor items require absolute ground placement outside the building footprint.",
        );
      }
      return;
    }
    if (roomIds.length === 0 && placement.kind === "ceiling") {
      addProjectIssue(
        issues,
        "project.room-membership-missing",
        `${itemPath}.placement`,
        "The resolved item placement must belong to one room.",
      );
    } else if (roomIds.length > 1) {
      addProjectIssue(
        issues,
        "project.room-membership-ambiguous",
        `${itemPath}.placement`,
        "The resolved item placement belongs to more than one room.",
      );
    } else if (
      placement.kind === "ceiling" &&
      roomIds.length === 1 &&
      roomIds[0] !== placement.roomId
    ) {
      addProjectIssue(
        issues,
        "project.ceiling-room-mismatch",
        `${itemPath}.placement.roomId`,
        `Ceiling placement declares room “${placement.roomId}” but its point belongs to room “${roomIds[0]}”.`,
      );
    }
  });
};
