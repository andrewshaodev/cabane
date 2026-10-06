import { deriveStairFlight, validateStairs, type HomeProject, type StairSpec } from "@cabane/engine";

export function stairCandidateProject(building: HomeProject, stair: StairSpec): HomeProject {
  return { ...building, stairs: [...building.stairs.filter(existing => existing.id !== stair.id), stair] };
}
export function validateStairCandidate(building: HomeProject, stair: StairSpec) {
  const candidate = stairCandidateProject(building, stair);
  return validateStairs(candidate).filter(issue => issue.path === `stairs[${candidate.stairs.length - 1}]`);
}
export function canDraftStair(building: HomeProject, stair: StairSpec) {
  return deriveStairFlight(building, stair) !== null;
}
