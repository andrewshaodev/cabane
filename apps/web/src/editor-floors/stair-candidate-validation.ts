import { deriveStairFlight, validateStairs, type HomeProject, type StraightStairSpec } from "@cabane/engine";

export function stairCandidateProject(building: HomeProject, stair: StraightStairSpec): HomeProject {
  return { ...building, stairs: [...building.stairs.filter(existing => existing.id !== stair.id), stair] };
}
export function validateStairCandidate(building: HomeProject, stair: StraightStairSpec) {
  const candidate = stairCandidateProject(building, stair);
  return validateStairs(candidate).filter(issue => issue.path === `stairs[${candidate.stairs.length - 1}]`);
}
export function canDraftStair(building: HomeProject, stair: StraightStairSpec) {
  return deriveStairFlight(building, stair) !== null;
}
