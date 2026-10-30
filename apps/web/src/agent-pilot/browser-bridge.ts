import { useCallback, useEffect, useRef, useState } from "react";
import type { useHomeEditorController } from "../editor-workspace/useHomeEditorController";
import { executeAgentRequest } from "./agent-command-executor";
import { createBrowserBridgeClient, type AgentPilotConnection } from "./browser-bridge-client";

export type { AgentPilotConnection } from "./browser-bridge-client";
type EditorController = ReturnType<typeof useHomeEditorController>;

export function useAgentPilotBridge(workspaceId: string, controller: EditorController) {
  const editorRef = useRef({ workspaceId, controller });
  editorRef.current = { workspaceId, controller };
  const bridgeRef = useRef<ReturnType<typeof createBrowserBridgeClient> | null>(null);
  const [connection, setConnection] = useState<AgentPilotConnection>({
    status: "disconnected",
    message: "Waiting for the pairing code from the local bridge.",
  });
  useEffect(() => {
    const bridge = createBrowserBridgeClient({
      workspaceId,
      origin: window.location.origin,
      onConnection: setConnection,
      execute: (request, isActive) =>
        executeAgentRequest(
          workspaceId,
          {
            get current() {
              // Every access after an await must still belong to the paired editor.
              if (!isActive() || editorRef.current.workspaceId !== workspaceId)
                throw new Error("The agent session is no longer paired with this workspace.");
              return editorRef.current.controller;
            },
          },
          request,
        ),
    });
    bridgeRef.current = bridge;
    setConnection({
      status: "disconnected",
      message: "Pair this workspace with the local bridge.",
    });
    const onPageHide = () => bridge.pageHide();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      bridge.close();
      bridgeRef.current = null;
    };
  }, [workspaceId]);
  const pair = useCallback(async (code: string) => bridgeRef.current?.pair(code), []);
  const disconnect = useCallback(() => bridgeRef.current?.disconnect(), []);
  return { connection, pair, disconnect };
}
