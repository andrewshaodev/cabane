import { deriveStairFlight, validateStairs, type HomeProject, type StairModelRegistries, type StairSpec } from "@cabane/engine";

export type StairValidationRegistries = StairModelRegistries;

export function stairCandidateProject(building: HomeProject, stair: StairSpec): HomeProject {
  return { ...building, stairs: [...building.stairs.filter(existing => existing.id !== stair.id), stair] };
}
export function validateStairCandidate(building: HomeProject, stair: StairSpec, registries?: StairValidationRegistries) {
  const candidate = stairCandidateProject(building, stair);
  return validateStairs(candidate, registries).filter(issue => issue.path === `stairs[${candidate.stairs.length - 1}]`);
}
export function canDraftStair(building: HomeProject, stair: StairSpec) {
  return deriveStairFlight(building, stair) !== null;
}
