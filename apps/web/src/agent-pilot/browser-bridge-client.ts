import type { AgentRequest } from "./agent-command-executor";

const BRIDGE_URL = "http://127.0.0.1:4317";
const DISCONNECTED_MESSAGE =
  "Disconnected from the local bridge. Restart it and pair this workspace again.";

export type AgentPilotConnection = {
  status: "disconnected" | "connecting" | "connected" | "error";
  message: string;
};

type BridgeBody = {
  ok?: boolean;
  error?: { message?: string };
  [key: string]: unknown;
};

type Session = { id: string; abort: AbortController };

// Serialize pairing across workspace clients so a slow obsolete /pair cannot replace a newer one.
let pairing = Promise.resolve();

class BridgeHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "The editor rejected the agent request.";

const bridgeJson = async <T extends BridgeBody>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const signal = AbortSignal.timeout(10_000);
  const response = await fetch(`${BRIDGE_URL}${path}`, {
    ...init,
    signal: init.signal ? AbortSignal.any([init.signal, signal]) : signal,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("The agent bridge returned an invalid JSON response.");
  const result = body as T;
  if (!response.ok || result.ok === false)
    throw new BridgeHttpError(
      response.status,
      result.error?.message ?? `Agent bridge returned HTTP ${response.status}.`,
    );
  return result;
};

const jsonPost = (body: unknown, signal?: AbortSignal): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
  ...(signal ? { signal } : {}),
});

function requestsFrom(value: unknown): AgentRequest[] {
  if (!Array.isArray(value)) throw new Error("The bridge did not return a request list.");
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object")
      throw new Error("The bridge returned an invalid request.");
    const candidate = item as Partial<AgentRequest>;
    if (typeof candidate.requestId !== "string" || typeof candidate.method !== "string")
      throw new Error("The bridge returned an invalid request.");
    return { requestId: candidate.requestId, method: candidate.method, params: candidate.params };
  });
}

// Owns the pairing generation and one execution queue. React only supplies the current editor.
export function createBrowserBridgeClient({
  workspaceId,
  origin,
  execute,
  onConnection,
}: {
  workspaceId: string;
  origin: string;
  execute: (request: AgentRequest, isActive: () => boolean) => Promise<unknown>;
  onConnection: (connection: AgentPilotConnection) => void;
}) {
  let generation = 0;
  let closed = false;
  let session: Session | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let execution = Promise.resolve();
  const unpair = async (id: string) => {
    try {
      await bridgeJson("/unpair", jsonPost({ sessionId: id, workspaceId }));
    } catch {
      // Stopping the local process already discards its session.
    }
  };
  const invalidate = () => {
    generation++;
    const previous = session;
    session = null;
    previous?.abort.abort();
    clearTimeout(timer);
    timer = undefined;
    return previous;
  };
  const active = (target: Session) => !closed && session === target && !target.abort.signal.aborted;
  const poll = async (target: Session) => {
    if (!active(target)) return;
    try {
      const query = new URLSearchParams({ sessionId: target.id, workspaceId });
      const result = await bridgeJson("/poll?" + query.toString(), { signal: target.abort.signal });
      if (!active(target)) return;
      for (const request of requestsFrom(result.requests)) {
        if (!active(target)) return;
        // A re-pair waits for an old in-flight executor to settle before starting another edit.
        const task = execution.then(async () => {
          if (!active(target)) return;
          let response: Record<string, unknown>;
          try {
            response = { ok: true, result: await execute(request, () => active(target)) };
          } catch (error) {
            response = { ok: false, error: { message: errorMessage(error) } };
          }
          if (!active(target)) return;
          try {
            await bridgeJson(
              "/respond",
              jsonPost(
                { sessionId: target.id, workspaceId, requestId: request.requestId, response },
                target.abort.signal,
              ),
            );
          } catch (error) {
            // The CLI may already have collected an expired request. Keep the editor paired.
            if (!(error instanceof BridgeHttpError) || error.status !== 404) throw error;
          }
        });
        execution = task.catch(() => undefined);
        await task;
      }
      if (active(target)) timer = setTimeout(() => void poll(target), 300);
    } catch {
      if (!active(target)) return;
      invalidate();
      void unpair(target.id);
      onConnection({ status: "disconnected", message: DISCONNECTED_MESSAGE });
    }
  };
  return {
    async pair(code: string) {
      if (closed) return;
      const previous = invalidate();
      if (previous) void unpair(previous.id);
      const attempt = generation;
      onConnection({ status: "connecting", message: "Pairing with the local bridge…" });
      const task = pairing.then(async () => {
        if (closed || generation !== attempt) return;
        const result = await bridgeJson(
          "/pair",
          jsonPost({ code: code.trim().toUpperCase(), workspaceId, origin }),
        );
        if (typeof result.sessionId !== "string" || !result.sessionId)
          throw new Error("The agent bridge did not return a session ID.");
        if (closed || generation !== attempt) {
          void unpair(result.sessionId);
          return;
        }
        const target = { id: result.sessionId, abort: new AbortController() };
        session = target;
        onConnection({ status: "connected", message: "Connected to this workspace." });
        void poll(target);
      });
      pairing = task.catch(() => undefined);
      try {
        await task;
      } catch (error) {
        if (!closed && generation === attempt)
          onConnection({ status: "error", message: errorMessage(error) });
      }
    },
    disconnect() {
      const previous = invalidate();
      if (previous) void unpair(previous.id);
      if (!closed)
        onConnection({ status: "disconnected", message: "Disconnected from the local bridge." });
    },
    pageHide() {
      const previous = invalidate();
      if (!previous) return;
      const query = new URLSearchParams({ sessionId: previous.id, workspaceId });
      if (
        typeof navigator.sendBeacon !== "function" ||
        !navigator.sendBeacon(`${BRIDGE_URL}/unpair?${query}`, "")
      )
        void unpair(previous.id);
      onConnection({ status: "disconnected", message: "Disconnected from the local bridge." });
    },
    close() {
      closed = true;
      const previous = invalidate();
      if (previous) void unpair(previous.id);
    },
  };
}
