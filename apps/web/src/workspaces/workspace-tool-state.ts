import type { HomeProjectRecord } from "@cabane/engine";

/** Save live tool state to both slices without publishing any pending editor work. */
export function updateWorkspaceToolState(record: HomeProjectRecord, toolId: string, value: unknown): HomeProjectRecord {
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(toolId)) throw new Error("Tool storage requires a namespaced ID.");
  const update = (project: HomeProjectRecord["draft"]) => ({
    ...project, toolState: { ...project.toolState, [toolId]: structuredClone(value) },
  });
  return { ...record, draft: update(record.draft), published: update(record.published), draftUpdatedAt: Date.now() };
}
