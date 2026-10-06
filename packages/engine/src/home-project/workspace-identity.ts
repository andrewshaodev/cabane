import type { HomeProjectRecord } from "./project-record-contract";

export function copyWorkspaceRecord(source: HomeProjectRecord, id: string, name: string, now = Date.now()): HomeProjectRecord {
  const record = structuredClone(source);
  record.homeId = id;
  record.draft.home = { ...record.draft.home, id, name };
  record.published.home = { ...record.published.home, id, name };
  for (const state of Object.values(record.bindings)) {
    state.draft.homeId = id;
    state.published.homeId = id;
  }
  return { ...record, revision: 0, draftUpdatedAt: now, publishedAt: source.publishedAt === 0 ? 0 : now };
}
