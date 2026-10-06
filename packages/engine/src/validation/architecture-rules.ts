import type { ManifestIssue } from "../types";

import {
  type RawObject,
  type ValidationContext
} from "./core";

import { validateCeilings } from "./ceiling-rules";
import { validateJunctions } from "./junction-rules";
import { validateOpenings } from "./opening-rules";
import { validateWalls } from "./wall-rules";

export const validateArchitecture = (
  rawFloor: RawObject,
  floorPath: string,
  roomIds: Set<string>,
  context: ValidationContext,
): readonly ManifestIssue[] => {
  const wallValidation = validateWalls(rawFloor, floorPath, context);
  const junctionValidation = validateJunctions(
    rawFloor,
    floorPath,
    wallValidation.wallIds,
    wallValidation.validWalls,
    context,
  );
  return [
    ...wallValidation.issues,
    ...junctionValidation.issues,
    ...validateOpenings(
      rawFloor,
      floorPath,
      wallValidation.walls,
      wallValidation.wallIds,
      wallValidation.validWalls,
      junctionValidation.validJunctions,
      context,
    ),
    ...validateCeilings(rawFloor, floorPath, roomIds, context),
  ];
};
