export type OnboardingEntry = "explore" | "connect" | "build" | null;
export interface LaunchOnboardingState {
  entry: OnboardingEntry;
  target?: { roomId: string; deviceId: string; slotId: string };
  introductionDismissed: boolean;
  starterConsumed: boolean;
  nudgeDismissed: boolean;
  firstControlConfirmed: boolean;
}
export const createLaunchOnboardingState = (): LaunchOnboardingState => ({
  entry: null,
  introductionDismissed: false,
  starterConsumed: false,
  nudgeDismissed: false,
  firstControlConfirmed: false,
});
export const returningLaunchOnboardingState = (): LaunchOnboardingState => ({
  ...createLaunchOnboardingState(),
  introductionDismissed: true,
  starterConsumed: true,
  nudgeDismissed: true,
});
export function parseLaunchOnboardingState(value: unknown): LaunchOnboardingState | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    ![null, "explore", "connect", "build"].includes(record.entry as OnboardingEntry) ||
    ["introductionDismissed", "starterConsumed", "nudgeDismissed", "firstControlConfirmed"].some(
      (key) => typeof record[key] !== "boolean",
    )
  )
    return null;
  const target = record.target as Record<string, unknown> | undefined;
  if (
    target !== undefined &&
    (!target ||
      typeof target !== "object" ||
      ["roomId", "deviceId", "slotId"].some(
        (key) => typeof target[key] !== "string" || !target[key],
      ))
  )
    return null;
  return {
    ...(target
      ? {
          target: {
            roomId: target.roomId as string,
            deviceId: target.deviceId as string,
            slotId: target.slotId as string,
          },
        }
      : {}),
    entry: record.entry as OnboardingEntry,
    introductionDismissed: record.introductionDismissed as boolean,
    starterConsumed: record.starterConsumed as boolean,
    nudgeDismissed: record.nudgeDismissed as boolean,
    firstControlConfirmed: record.firstControlConfirmed as boolean,
  };
}
