/** Optional browser-local guidance; never part of an exported HomeProject. */
export const BUILD_TUTORIAL_STEPS = ["walls", "door", "window", "name", "arrange", "connect"] as const;
export type BuildTutorialStep = typeof BUILD_TUTORIAL_STEPS[number];
export interface BuildTutorialState {
  status: "active" | "dismissed" | "completed";
  step: BuildTutorialStep;
  skipped: BuildTutorialStep[];
  target?: { floorId: string; roomId: string };
  readyToConnect: boolean;
}
export const createBuildTutorialState = (): BuildTutorialState => ({
  status: "active", step: "walls", skipped: [], readyToConnect: false,
});
export function parseBuildTutorialState(value: unknown): BuildTutorialState | undefined {
  if (!value || typeof value !== "object") return undefined;
  const state = value as BuildTutorialState;
  if (!["active", "dismissed", "completed"].includes(state.status)
    || !BUILD_TUTORIAL_STEPS.includes(state.step) || !Array.isArray(state.skipped)
    || !state.skipped.every(step => BUILD_TUTORIAL_STEPS.includes(step))
    || typeof state.readyToConnect !== "boolean"
    || (state.target !== undefined && (!state.target || typeof state.target.floorId !== "string" || typeof state.target.roomId !== "string"))) return undefined;
  return { status: state.status, step: state.step, skipped: [...new Set(state.skipped)],
    readyToConnect: state.readyToConnect, ...(state.target ? { target: { ...state.target } } : {}) };
}
