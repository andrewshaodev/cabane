import { array, record, keys, string, finite } from "./schema-json-values";
import { addProjectIssue, type HomeProjectIssue } from "./validation-types";

export function wallNichesSchema(value: unknown, path: string, issues: HomeProjectIssue[]) {
  if (value === undefined) return;
  array(value, path, issues)?.forEach((value, index) => {
    const location = `${path}[${index}]`;
    const niche = record(value, location, issues);
    if (!niche) return;
    keys(
      niche,
      [
        "id",
        "side",
        "offsetFromWallStartPlanUnits",
        "widthPlanUnits",
        "bottomMeters",
        "heightMeters",
        "depthMeters",
        "shelfHeightsMeters",
        "shelfThicknessMeters",
      ],
      location,
      issues,
    );
    string(niche.id, `${location}.id`, issues);
    if (niche.shelfHeightsMeters !== undefined)
      array(niche.shelfHeightsMeters, `${location}.shelfHeightsMeters`, issues)?.forEach(
        (value, index) => finite(value, `${location}.shelfHeightsMeters[${index}]`, issues),
      );
    if (niche.shelfThicknessMeters !== undefined)
      finite(niche.shelfThicknessMeters, `${location}.shelfThicknessMeters`, issues);
    if (!["left", "right"].includes(String(niche.side)))
      addProjectIssue(
        issues,
        "project.niche-side",
        `${location}.side`,
        "Niche side must be left or right.",
      );
    for (const key of [
      "offsetFromWallStartPlanUnits",
      "widthPlanUnits",
      "bottomMeters",
      "heightMeters",
      "depthMeters",
    ])
      finite(niche[key], `${location}.${key}`, issues);
  });
}
