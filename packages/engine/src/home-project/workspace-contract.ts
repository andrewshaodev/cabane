import type { HomeProjectRecord } from "./project-record-contract";

export interface WorkspaceMetadata {
  id: string;
  name: string;
  homeAssistantUrl: string | null;
  hasPublished: boolean;
  createdAt: number;
}

export interface WorkspaceEntry {
  metadata: WorkspaceMetadata;
  record?: HomeProjectRecord;
  error?: string;
}
