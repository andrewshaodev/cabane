import type { ManifestIssue, PlanPoint } from "../types";

import {
  isNonEmptyString,
  isObject,
  isPlanPoint,
  issue,
  registerId,
  type RawObject,
  type ValidationContext,
} from "./core";

import { ValidJunction, ValidWall } from "./architecture-validation-contract";
import {
  junctionTopologyIsValid,
  planPointsEqual,
  pointOnWallSegment,
  wallIntersectionPoints,
} from "./geometry";

export const validateJunctions = (
  rawFloor: RawObject,
  floorPath: string,
  wallIds: Set<string>,
  validWalls: readonly ValidWall[],
  context: ValidationContext,
) => {
  const issues: ManifestIssue[] = [];
  const junctions = Array.isArray(rawFloor.wallJunctions) ? rawFloor.wallJunctions : [];
  if (!Array.isArray(rawFloor.wallJunctions)) {
    issues.push(
      issue(
        "wall-junctions.required",
        `${floorPath}.wallJunctions`,
        "A floor must declare every architectural wall junction.",
      ),
    );
  }
  const validJunctions: ValidJunction[] = [];
  junctions.forEach((rawJunction, junctionIndex) => {
    const junctionPath = `${floorPath}.wallJunctions[${junctionIndex}]`;
    if (!isObject(rawJunction)) {
      issues.push(
        issue("wall-junction.type", junctionPath, "Each wall junction must be an object."),
      );
      return;
    }
    issues.push(...registerId(context, rawJunction.id, `${junctionPath}.id`));
    if (!isPlanPoint(rawJunction.at)) {
      issues.push(
        issue(
          "wall-junction.point",
          `${junctionPath}.at`,
          "A wall junction requires one finite plan point.",
        ),
      );
      return;
    }
    if (
      !Array.isArray(rawJunction.wallIds) ||
      rawJunction.wallIds.length < 2 ||
      rawJunction.wallIds.some((id) => !isNonEmptyString(id))
    ) {
      issues.push(
        issue(
          "wall-junction.walls",
          `${junctionPath}.wallIds`,
          "A wall junction requires at least two exact wall IDs.",
        ),
      );
      return;
    }
    const declaredIds = rawJunction.wallIds as string[];
    if (new Set(declaredIds).size !== declaredIds.length) {
      issues.push(
        issue(
          "wall-junction.wall-duplicate",
          `${junctionPath}.wallIds`,
          "Junction wall IDs must be unique.",
        ),
      );
    }
    const missingId = declaredIds.find((id) => !wallIds.has(id));
    if (missingId) {
      issues.push(
        issue(
          "wall-junction.wall",
          `${junctionPath}.wallIds`,
          `Junction references unknown wall "${missingId}".`,
        ),
      );
      return;
    }
    const incidentIds = validWalls
      .filter((wall) => pointOnWallSegment(rawJunction.at as PlanPoint, wall))
      .map((wall) => wall.id)
      .sort();
    const uniqueDeclaredIds = [...new Set(declaredIds)].sort();
    if (uniqueDeclaredIds.some((id) => !incidentIds.includes(id))) {
      issues.push(
        issue(
          "wall-junction.off-wall",
          `${junctionPath}.at`,
          "The junction point must lie exactly on every referenced wall.",
        ),
      );
    } else if (
      incidentIds.length !== uniqueDeclaredIds.length ||
      incidentIds.some((id, index) => id !== uniqueDeclaredIds[index])
    ) {
      issues.push(
        issue(
          "wall-junction.incomplete",
          `${junctionPath}.wallIds`,
          "The junction must list every wall incident at its point.",
        ),
      );
    }
    const declaredWalls = validWalls.filter((wall) => uniqueDeclaredIds.includes(wall.id));
    if (
      declaredWalls.length === uniqueDeclaredIds.length &&
      !junctionTopologyIsValid(rawJunction.at, declaredWalls)
    ) {
      issues.push(
        issue(
          "wall-junction.topology",
          junctionPath,
          "A junction must represent one corner, collinear join, T-junction, or crossing without overlapping wall rays.",
        ),
      );
    }
    if (
      validJunctions.some((junction) => planPointsEqual(junction.at, rawJunction.at as PlanPoint))
    ) {
      issues.push(
        issue(
          "wall-junction.duplicate",
          `${junctionPath}.at`,
          "Only one junction may own a plan point.",
        ),
      );
    }
    validJunctions.push({
      at: rawJunction.at,
      wallIds: uniqueDeclaredIds,
      path: junctionPath,
    });
  });

  for (let leftIndex = 0; leftIndex < validWalls.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < validWalls.length; rightIndex += 1) {
      const left = validWalls[leftIndex];
      const right = validWalls[rightIndex];
      for (const at of wallIntersectionPoints(left, right)) {
        const owner = validJunctions.find(
          (junction) =>
            planPointsEqual(junction.at, at) &&
            junction.wallIds.includes(left.id) &&
            junction.wallIds.includes(right.id),
        );
        if (!owner) {
          issues.push(
            issue(
              "wall-junction.missing",
              `${floorPath}.wallJunctions`,
              `Walls "${left.id}" and "${right.id}" intersect at [${at[0]}, ${at[1]}] without a declared junction.`,
            ),
          );
        }
      }
    }
  }
  return { issues, validJunctions };
};
