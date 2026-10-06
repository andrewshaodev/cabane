export const WORKSPACE_ONBOARDING_KEY = "onboarding:v1";
export type OnboardingPath = "connect" | "build";
export interface WorkspaceOnboardingState {
  version: 1;
  demoWorkspaceId: string | null;
  welcomeDismissed: boolean;
  nudgeDismissed: boolean;
  destinations: Partial<Record<OnboardingPath, string>>;
}
export function initialWorkspaceOnboarding(demoWorkspaceId: string | null): WorkspaceOnboardingState {
  return { version: 1, demoWorkspaceId, welcomeDismissed: demoWorkspaceId === null,
    nudgeDismissed: demoWorkspaceId === null, destinations: {} };
}
export function parseWorkspaceOnboarding(value: unknown): WorkspaceOnboardingState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const id = (input: unknown): input is string => typeof input === "string" && input.trim().length > 0;
  if (v.version !== 1 || !(v.demoWorkspaceId === null || id(v.demoWorkspaceId))
    || typeof v.welcomeDismissed !== "boolean" || typeof v.nudgeDismissed !== "boolean"
    || !v.destinations || typeof v.destinations !== "object" || Array.isArray(v.destinations)) return null;
  const destinations = v.destinations as Record<string, unknown>;
  if (Object.entries(destinations).some(([key, value]) => !["connect", "build"].includes(key) || !id(value))) return null;
  return { version: 1, demoWorkspaceId: v.demoWorkspaceId, welcomeDismissed: v.welcomeDismissed,
    nudgeDismissed: v.nudgeDismissed, destinations: { ...destinations } as WorkspaceOnboardingState["destinations"] };
}
export class DeletedOnboardingWorkspaceError extends Error {
  constructor(readonly workspaceId: string) {
    super("Your setup workspace was deleted. Create a new home to continue.");
    this.name = "DeletedOnboardingWorkspaceError";
  }
}
