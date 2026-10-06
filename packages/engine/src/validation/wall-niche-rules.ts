import { junctionOccupiedIntervalsForWall } from "../opening-junction-clearance";
import { wallLengthPlanUnits } from "../geometry";
import {
  isFiniteNumber,
  isObject,
  isPlanPoint,
  issue,
  registerId,
  type RawObject,
  type ValidationContext,
} from "./core";
import type { ManifestIssue } from "../types";

/** Blind wall cuts preserve a 20 mm back and stay clear of openings and corners. */
export function validateWallNiches(
  wall: RawObject,
  floor: RawObject,
  path: string,
  context: ValidationContext,
): ManifestIssue[] {
  if (wall.niches === undefined) return [];
  if (!Array.isArray(wall.niches))
    return [issue("wall.niches", `${path}.niches`, "Wall niches must be an array.")];
  const issues: ManifestIssue[] = [];
  const scale =
    isObject(floor.coordinates) && isFiniteNumber(floor.coordinates.metersPerPlanUnit)
      ? floor.coordinates.metersPerPlanUnit
      : 1;
  const length = wallLengthPlanUnits(wall as never);
  const thickness = Number(wall.thicknessMeters);
  const height = Number(wall.heightMeters ?? floor.defaultWallHeightMeters);
  const valid: RawObject[] = [];
  wall.niches.forEach((niche, index) => {
    const location = `${path}.niches[${index}]`;
    if (!isObject(niche)) {
      issues.push(issue("niche.type", location, "Each niche must be an object."));
      return;
    }
    issues.push(...registerId(context, niche.id, `${location}.id`));
    if (niche.side !== "left" && niche.side !== "right")
      issues.push(
        issue(
          "niche.side",
          `${location}.side`,
          "Choose the left or right wall face, viewed from its start toward its end.",
        ),
      );
    const keys = [
      "offsetFromWallStartPlanUnits",
      "widthPlanUnits",
      "bottomMeters",
      "heightMeters",
      "depthMeters",
    ];
    if (keys.some((key) => !isFiniteNumber(niche[key]))) {
      issues.push(issue("niche.dimensions", location, "Niche dimensions must be finite numbers."));
      return;
    }
    const offset = Number(niche.offsetFromWallStartPlanUnits),
      width = Number(niche.widthPlanUnits);
    const bottom = Number(niche.bottomMeters),
      top = bottom + Number(niche.heightMeters);
    const clearance = thickness / 2 / scale + 0.002 / scale;
    if (width <= 0 || offset < clearance || offset + width > length - clearance)
      issues.push(
        issue(
          "niche.span",
          location,
          "Niche width and offset must fit within the wall, clear of its corner caps.",
        ),
      );
    if (bottom < 0.012 || Number(niche.heightMeters) <= 0 || top > height - 0.002)
      issues.push(
        issue(
          "niche.height",
          location,
          "Niche must stay above the floor finish and below the wall top.",
        ),
      );
    if (Number(niche.depthMeters) <= 0 || Number(niche.depthMeters) > thickness - 0.02 + 1e-8)
      issues.push(
        issue(
          "niche.depth",
          `${location}.depthMeters`,
          "Niche depth must leave at least 20 mm of solid wall behind it.",
        ),
      );
    if (niche.shelfHeightsMeters !== undefined) {
      const shelves = niche.shelfHeightsMeters,
        slab = Number(niche.shelfThicknessMeters ?? 0.025);
      if (
        !Array.isArray(shelves) ||
        !Number.isFinite(slab) ||
        slab <= 0 ||
        shelves.some(
          (level, index) =>
            !isFiniteNumber(level) ||
            level <= 0 ||
            level + slab >= Number(niche.heightMeters) ||
            shelves.slice(0, index).some((other) => Math.abs(Number(other) - level) < slab + 1e-7),
        )
      )
        issues.push(
          issue(
            "niche.shelves",
            location,
            "Shelf heights must be distinct, fit within the niche, and leave room for their positive thickness.",
          ),
        );
    } else if (
      niche.shelfThicknessMeters !== undefined &&
      (!isFiniteNumber(niche.shelfThicknessMeters) || niche.shelfThicknessMeters <= 0)
    )
      issues.push(issue("niche.shelf-thickness", location, "Shelf thickness must be positive."));
    const overlaps = (
      other: RawObject,
      otherOffset: string,
      otherWidth: string,
      otherBottom: string,
      otherHeight: string,
    ) =>
      offset < Number(other[otherOffset]) + Number(other[otherWidth]) - 1e-7 &&
      offset + width > Number(other[otherOffset]) + 1e-7 &&
      bottom < Number(other[otherBottom]) + Number(other[otherHeight]) - 1e-7 &&
      top > Number(other[otherBottom]) + 1e-7;
    if (
      valid.some((other) => overlaps(other, keys[0], keys[1], keys[2], keys[3])) ||
      (Array.isArray(floor.openings) &&
        floor.openings.some(
          (other) =>
            isObject(other) &&
            other.wallId === wall.id &&
            overlaps(
              other,
              "offsetFromWallStartPlanUnits",
              "widthPlanUnits",
              "sillHeightMeters",
              "openingHeightMeters",
            ),
        ))
    )
      issues.push(
        issue("niche.overlap", location, "A niche cannot overlap another niche or wall opening."),
      );
    // A T junction can occur inside a long wall: reserve the actual intersecting span too.
    if (Array.isArray(floor.wallJunctions) && Array.isArray(wall.from) && Array.isArray(wall.to)) {
      const dx = Number(wall.to[0]) - Number(wall.from[0]),
        dz = Number(wall.to[1]) - Number(wall.from[1]);
      for (const junction of floor.wallJunctions) {
        if (
          !isObject(junction) ||
          !Array.isArray(junction.wallIds) ||
          !junction.wallIds.includes(wall.id) ||
          !Array.isArray(junction.at)
        )
          continue;
        const distance =
          ((Number(junction.at[0]) - Number(wall.from[0])) * dx +
            (Number(junction.at[1]) - Number(wall.from[1])) * dz) /
          length;
        const wallIds = junction.wallIds;
        const adjacent = Array.isArray(floor.walls)
          ? floor.walls.filter((w) => isObject(w) && wallIds.includes(w.id))
          : [];
        const walls = adjacent.filter(
          (w) =>
            isObject(w) &&
            isPlanPoint(w.from) &&
            isPlanPoint(w.to) &&
            isFiniteNumber(w.thicknessMeters),
        );
        const intervals = junctionOccupiedIntervalsForWall(
          wall as never,
          junction as never,
          walls as never,
          scale,
          height,
        );
        if (
          intervals.some(
            (interval) =>
              interval.topMeters > bottom + 1e-7 &&
              distance + interval.end > offset + 1e-7 &&
              distance + interval.start < offset + width - 1e-7,
          )
        )
          issues.push(
            issue("niche.junction", location, "Move the niche clear of the wall junction."),
          );
      }
    }
    valid.push(niche);
  });
  return issues;
}
