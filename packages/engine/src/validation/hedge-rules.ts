import { validHedge } from "../hedges/hedge-validity";
import type { HedgeSpec, ManifestIssue } from "../types";
import { isObject, issue, registerId, type RawObject, type ValidationContext } from "./core";

export function validateHedges(floor: RawObject, path: string, context: ValidationContext): ManifestIssue[] {
  if (floor.hedges === undefined) return [];
  if (!Array.isArray(floor.hedges)) return [issue("hedge.collection", `${path}.hedges`, "Hedges must be an array.")];
  const issues: ManifestIssue[] = [];
  const scale = isObject(floor.coordinates) && typeof floor.coordinates.metersPerPlanUnit === "number" ? floor.coordinates.metersPerPlanUnit : 1;
  floor.hedges.forEach((hedge, index) => {
    const at = `${path}.hedges[${index}]`;
    if (!isObject(hedge)) { issues.push(issue("hedge.invalid", at, "Hedge must be an object.")); return; }
    issues.push(...registerId(context, hedge.id, `${at}.id`));
    if (!validHedge(hedge as unknown as HedgeSpec, scale)) issues.push(issue("hedge.invalid", at, "Use distinct endpoints, a supported style, height 0.2–5 m and width 0.2–3 m."));
  });
  return issues;
}
