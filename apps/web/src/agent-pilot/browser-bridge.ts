import { useCallback, useEffect, useRef, useState } from "react";
import type { useHomeEditorController } from "../editor-workspace/useHomeEditorController";
import { executeAgentRequest, type AgentRequest } from "./agent-command-executor";

type EditorController = ReturnType<typeof useHomeEditorController>;

const BRIDGE_URL = "http://127.0.0.1:4317";
const DISCONNECTED_MESSAGE =
  "Disconnected from the local bridge. Restart it and pair this workspace again.";

type BridgeBody = {
  ok?: boolean;
  error?: { message?: string };
  [key: string]: unknown;
};

export type AgentPilotConnection = {
  status: "disconnected" | "connecting" | "connected" | "error";
  message: string;
};

const bridgeJson = async <T extends BridgeBody>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${BRIDGE_URL}${path}`, init);
  const body = (await response.json().catch(() => ({}))) as T;
  if (!response.ok || body.ok === false) {
    throw new Error(body.error?.message ?? `Agent bridge returned HTTP ${response.status}.`);
  }
  return body;
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "The editor rejected the agent request.";

export function useAgentPilotBridge(workspaceId: string, controller: EditorController) {
  const controllerRef = useRef(controller);
  const pairedWorkspaceRef = useRef(workspaceId);
  const sessionIdRef = useRef<string | null>(null);
  controllerRef.current = controller;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connection, setConnection] = useState<AgentPilotConnection>({
    status: "disconnected",
    message: "Waiting for the pairing code from the local bridge.",
  });

  const pair = useCallback(
    async (code: string) => {
      pairedWorkspaceRef.current = workspaceId;
      setConnection({ status: "connecting", message: "Pairing with the local bridge…" });
      try {
        const result = await bridgeJson<{ sessionId: string }>("/pair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            workspaceId,
            origin: location.origin,
          }),
        });
        sessionIdRef.current = result.sessionId;
        setSessionId(result.sessionId);
        setConnection({ status: "connected", message: "Connected to this workspace." });
      } catch (error) {
        sessionIdRef.current = null;
        setSessionId(null);
        setConnection({ status: "error", message: errorMessage(error) });
      }
    },
    [workspaceId],
  );

  const unpairSession = useCallback(
    async (targetSessionId: string | null, targetWorkspaceId = workspaceId) => {
      if (!targetSessionId) return;
      try {
        await bridgeJson("/unpair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: targetSessionId, workspaceId: targetWorkspaceId }),
        });
      } catch {
        // The bridge may already have been stopped; its in-memory session is then gone.
      }
    },
    [workspaceId],
  );

  const disconnect = useCallback(() => {
    const targetSessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    pairedWorkspaceRef.current = workspaceId;
    setSessionId(null);
    setConnection({ status: "disconnected", message: "Disconnected from the local bridge." });
    void unpairSession(targetSessionId);
  }, [unpairSession, workspaceId]);

  useEffect(() => {
    if (pairedWorkspaceRef.current === workspaceId) return;
    pairedWorkspaceRef.current = workspaceId;
    sessionIdRef.current = null;
    setSessionId(null);
    setConnection({
      status: "disconnected",
      message: "Workspace changed; pair this workspace again.",
    });
  }, [workspaceId]);

  useEffect(() => {
    return () => {
      const targetSessionId = sessionIdRef.current;
      sessionIdRef.current = null;
      void unpairSession(targetSessionId);
    };
  }, [unpairSession]);

  useEffect(() => {
    if (!sessionId) return undefined;
    const onPageHide = () => {
      const targetSessionId = sessionIdRef.current;
      if (!targetSessionId) return;
      const query = new URLSearchParams({
        sessionId: targetSessionId,
        workspaceId,
      });
      if (typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(`${BRIDGE_URL}/unpair?${query.toString()}`, "");
      } else {
        void unpairSession(targetSessionId);
      }
    };
    globalThis.addEventListener("pagehide", onPageHide);
    return () => globalThis.removeEventListener("pagehide", onPageHide);
  }, [sessionId, unpairSession, workspaceId]);

  useEffect(() => {
    if (!sessionId) return undefined;
    let stopped = false;
    let timer: ReturnType<typeof globalThis.setTimeout> | null = null;
    const poll = async () => {
      if (pairedWorkspaceRef.current !== workspaceId) return;
      try {
        const result = await bridgeJson<{ requests: AgentRequest[] }>(
          `/poll?sessionId=${encodeURIComponent(sessionId)}&workspaceId=${encodeURIComponent(workspaceId)}`,
        );
        for (const request of result.requests) {
          let response: Record<string, unknown>;
          try {
            response = {
              ok: true,
              result: await executeAgentRequest(workspaceId, controllerRef, request),
            };
          } catch (error) {
            response = { ok: false, error: { message: errorMessage(error) } };
          }
          await bridgeJson("/respond", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              workspaceId,
              requestId: request.requestId,
              response,
            }),
          });
        }
        if (!stopped) timer = globalThis.setTimeout(() => void poll(), 300);
      } catch {
        if (!stopped && sessionIdRef.current === sessionId) {
          sessionIdRef.current = null;
          setSessionId(null);
          setConnection({ status: "disconnected", message: DISCONNECTED_MESSAGE });
        }
      }
    };
    void poll();
    return () => {
      stopped = true;
      if (timer !== null) globalThis.clearTimeout(timer);
    };
  }, [sessionId, workspaceId]);

  return { connection, pair, disconnect };
}
