import type { HomeProjectRecord } from "@cabane/engine";
import type { EditorOpenRequest } from "../editor-connect/useConnectEditor";

export interface ConnectWorkspaceProps {
  onWorkspaces?: () => void;
  onRecoveryWorkspaces?: () => void;
  initialRequest?: EditorOpenRequest;
  navigation?: { request: EditorOpenRequest; go: (request: EditorOpenRequest, replace?: boolean) => void; exitRequested: boolean };
  homeAssistantUrl?: string | null;
  onPrepareOrigin?: (record: HomeProjectRecord, origin: string | null) => Promise<HomeProjectRecord>;
}

export type HomeEditorExitReason = "draft-saved" | "applied";
