import {
  createBuildTutorialState,
  loadSetupRecord,
  saveSetupRecord,
  type BuildTutorialState,
} from "@cabane/engine";

// Preserve guidance for this session even when browser storage is unavailable.
const session = new Map<string, { state: BuildTutorialState; durable: boolean }>();
export function readBuildTutorial(homeId: string) {
  if (session.has(homeId)) return session.get(homeId)!;
  try {
    const loaded = loadSetupRecord(window.localStorage, homeId);
    return { state: loaded.record.buildTutorial, durable: loaded.durable };
  } catch {
    return { state: undefined, durable: false };
  }
}
export function writeBuildTutorial(homeId: string, state: BuildTutorialState) {
  let durable = false;
  try {
    const { record } = loadSetupRecord(window.localStorage, homeId);
    durable = saveSetupRecord(window.localStorage, homeId, { ...record, buildTutorial: state });
  } catch {
    /* Guidance cannot block an editor action. */
  }
  session.set(homeId, { state, durable });
  return durable;
}
export function enrollBuildTutorial(homeId: string) {
  const current = readBuildTutorial(homeId);
  if (current.state) return current.durable;
  return writeBuildTutorial(homeId, createBuildTutorialState());
}
export function forgetBuildTutorial(homeId: string) {
  session.delete(homeId);
}
