import type { ManifestIssue } from "../types";

import {
  isFiniteNumber,
  isObject,
  isPolygon,
  issue,
  registerId,
  type RawObject,
  type ValidationContext,
} from "./core";

export const validateCeilings = (
  rawFloor: RawObject,
  floorPath: string,
  roomIds: Set<string>,
  context: ValidationContext,
) => {
  const issues: ManifestIssue[] = [];
  if (rawFloor.ceilings !== undefined && !Array.isArray(rawFloor.ceilings)) {
    return [issue("ceilings.type", `${floorPath}.ceilings`, "Ceilings must be an array.")];
  }
  if (!Array.isArray(rawFloor.ceilings)) return issues;
  rawFloor.ceilings.forEach((rawCeiling, ceilingIndex) => {
    const ceilingPath = `${floorPath}.ceilings[${ceilingIndex}]`;
    if (!isObject(rawCeiling)) {
      issues.push(issue("ceiling.type", ceilingPath, "Each ceiling must be an object."));
      return;
    }
    issues.push(...registerId(context, rawCeiling.id, `${ceilingPath}.id`));
    if (
      !Array.isArray(rawCeiling.roomIds) ||
      rawCeiling.roomIds.some((id) => typeof id !== "string" || !roomIds.has(id))
    ) {
      issues.push(
        issue(
          "ceiling.rooms",
          `${ceilingPath}.roomIds`,
          "Ceiling room IDs must reference rooms on this floor.",
        ),
      );
    }
    if (rawCeiling.kind === "flat") {
      if (!isFiniteNumber(rawCeiling.heightMeters) || rawCeiling.heightMeters <= 0) {
        issues.push(
          issue(
            "ceiling.height",
            `${ceilingPath}.heightMeters`,
            "Flat ceiling height must be greater than zero.",
          ),
        );
      }
    } else if (rawCeiling.kind === "sloped") {
      if (!Array.isArray(rawCeiling.planes) || rawCeiling.planes.length === 0) {
        issues.push(
          issue(
            "ceiling.planes",
            `${ceilingPath}.planes`,
            "A sloped ceiling requires at least one plane.",
          ),
        );
      } else {
        rawCeiling.planes.forEach((plane, planeIndex) => {
          const planePath = `${ceilingPath}.planes[${planeIndex}]`;
          if (!isObject(plane) || !isPolygon(plane.boundary)) {
            issues.push(
              issue(
                "ceiling.plane-boundary",
                `${planePath}.boundary`,
                "Ceiling plane boundary must be a polygon.",
              ),
            );
          }
          if (
            !isObject(plane) ||
            !isFiniteNumber(plane.lowHeightMeters) ||
            !isFiniteNumber(plane.highHeightMeters) ||
            plane.highHeightMeters <= plane.lowHeightMeters
          ) {
            issues.push(
              issue(
                "ceiling.plane-height",
                planePath,
                "Sloped ceiling high height must exceed its low height.",
              ),
            );
          }
        });
      }
    } else {
      issues.push(
        issue("ceiling.kind", `${ceilingPath}.kind`, "Ceiling kind must be flat or sloped."),
      );
    }
  });
  return issues;
};
