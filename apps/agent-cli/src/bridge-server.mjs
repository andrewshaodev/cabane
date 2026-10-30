import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";

export const HOST = "127.0.0.1";
export const DEFAULT_PORT = 4317;
const PROTOCOL_VERSION = "2";
const MAX_BODY_BYTES = 128 * 1024;
const MAX_EDITOR_RESPONSE_BYTES = 8 * 1024 * 1024;
const MAX_PENDING_REQUESTS = 100;
const REQUEST_TTL_MS = 30_000;
const DEFAULT_ALLOWED_ORIGINS = [
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  "https://smart-cabane.vercel.app",
];

class BridgeError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function object(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new BridgeError(400, `${name} must be a JSON object.`);
  return value;
}

function readJson(request, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > maxBytes) {
        reject(new BridgeError(413, "Request body is too large."));
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    request.once("end", () => {
      if (size > maxBytes) return;
      try {
        resolve(object(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"), "Body"));
      } catch (error) {
        reject(
          error instanceof BridgeError
            ? error
            : new BridgeError(400, "Request body must be valid JSON."),
        );
      }
    });
    request.once("error", reject);
    request.once("aborted", () => reject(new BridgeError(400, "Request body was interrupted.")));
  });
}

// State belongs to one bridge instance. The handler can be exercised without opening a socket.
export function createBridge({ origins = [], now = Date.now } = {}) {
  const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...origins]);
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const code =
    "MCBN-" + [...randomBytes(6)].map((byte) => alphabet[byte % alphabet.length]).join("");
  let session = null;
  const pending = new Map();
  const responses = new Map();
  const clearSession = () => {
    session = null;
    pending.clear();
    responses.clear();
  };
  const requireSession = (request, sessionId, workspaceId) => {
    if (!session || session.sessionId !== sessionId)
      throw new BridgeError(401, "No Cabane editor is paired with this bridge.");
    if (workspaceId !== undefined && workspaceId !== null && workspaceId !== session.workspaceId)
      throw new BridgeError(401, "The workspace does not match the paired workspace.");
    if (request.headers.origin && request.headers.origin !== session.origin)
      throw new BridgeError(401, "The browser origin does not match the paired editor.");
    return session;
  };
  const cleanupExpired = () => {
    const timestamp = now();
    for (const [requestId, item] of pending) {
      if (timestamp - item.createdAt <= REQUEST_TTL_MS) continue;
      pending.delete(requestId);
      responses.set(requestId, {
        sessionId: item.sessionId,
        createdAt: timestamp,
        response: {
          ok: false,
          error: { message: "The agent request expired before the editor answered." },
        },
      });
    }
    for (const [requestId, item] of responses)
      if (timestamp - item.createdAt > REQUEST_TTL_MS) responses.delete(requestId);
  };
  const headers = (request) => ({
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    ...(allowedOrigins.has(request.headers.origin)
      ? { "Access-Control-Allow-Origin": request.headers.origin }
      : {}),
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  });
  const send = (request, response, status, body) => {
    response.writeHead(status, headers(request));
    response.end(JSON.stringify(body));
  };
  const route = async (request, response, url) => {
    cleanupExpired();
    const host = request.headers.host;
    if (typeof host === "string" && !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host))
      throw new BridgeError(403, "The bridge only accepts requests addressed to localhost.");
    const origin = request.headers.origin;
    if (origin !== undefined && !allowedOrigins.has(origin))
      throw new BridgeError(403, `Browser origin ${origin} is not allowed by this agent bridge.`);
    if (request.method === "OPTIONS") {
      response.writeHead(204, headers(request));
      response.end();
      return;
    }
    if (request.method === "GET" && url.pathname === "/health") {
      send(request, response, 200, { ok: true, protocolVersion: PROTOCOL_VERSION });
      return;
    }
    if (request.method === "GET" && url.pathname === "/status") {
      send(request, response, 200, {
        ok: true,
        protocolVersion: PROTOCOL_VERSION,
        paired: session !== null,
        // The local CLI discovers the session here. Browser clients receive it only by pairing.
        ...(!origin && session ? session : {}),
        pendingCount: pending.size,
      });
      return;
    }
    if (request.method === "POST" && url.pathname === "/pair") {
      const body = await readJson(request);
      if (body.code !== code) throw new BridgeError(401, "Pairing code is incorrect.");
      if (typeof body.workspaceId !== "string" || !body.workspaceId.trim())
        throw new BridgeError(400, "workspaceId is required.");
      if (origin && body.origin !== undefined && body.origin !== origin)
        throw new BridgeError(400, "Pairing origin does not match the browser origin.");
      clearSession();
      session = {
        sessionId: randomUUID(),
        workspaceId: body.workspaceId,
        origin: origin ?? (typeof body.origin === "string" ? body.origin : "unknown"),
      };
      send(request, response, 200, {
        ok: true,
        protocolVersion: PROTOCOL_VERSION,
        sessionId: session.sessionId,
      });
      return;
    }
    if (request.method === "POST" && url.pathname === "/unpair") {
      const body = await readJson(request);
      const sessionId = body.sessionId ?? url.searchParams.get("sessionId");
      const workspaceId = body.workspaceId ?? url.searchParams.get("workspaceId");
      if (typeof sessionId !== "string" || !sessionId)
        throw new BridgeError(400, "sessionId is required.");
      if (session?.sessionId === sessionId) {
        requireSession(request, sessionId, workspaceId);
        clearSession();
      }
      send(request, response, 200, { ok: true, paired: false });
      return;
    }
    if (request.method === "GET" && url.pathname === "/poll") {
      const current = requireSession(
        request,
        url.searchParams.get("sessionId"),
        url.searchParams.get("workspaceId"),
      );
      const requests = [...pending.values()]
        .filter((item) => item.sessionId === current.sessionId && !item.delivered)
        .slice(0, 4)
        .map((item) => {
          item.delivered = true;
          return { requestId: item.requestId, method: item.method, params: item.params };
        });
      send(request, response, 200, { ok: true, requests });
      return;
    }
    if (request.method === "POST" && url.pathname === "/respond") {
      const body = await readJson(request, MAX_EDITOR_RESPONSE_BYTES);
      const current = requireSession(request, body.sessionId, body.workspaceId);
      const item = pending.get(body.requestId);
      if (!item || item.sessionId !== current.sessionId) {
        // A late answer must not overwrite a timeout or disconnect the remaining session.
        if (responses.get(body.requestId)?.sessionId === current.sessionId) {
          send(request, response, 200, { ok: true });
          return;
        }
        throw new BridgeError(404, "Agent request was not found.");
      }
      const answer = object(body.response, "Response");
      if (typeof answer.ok !== "boolean") throw new BridgeError(400, "Response.ok is required.");
      pending.delete(body.requestId);
      responses.set(body.requestId, {
        sessionId: current.sessionId,
        createdAt: now(),
        response: answer,
      });
      send(request, response, 200, { ok: true });
      return;
    }
    if (request.method === "POST" && url.pathname === "/request") {
      const body = await readJson(request);
      if (!session) throw new BridgeError(409, "Pair an editor before sending agent requests.");
      const current = requireSession(request, body.sessionId, body.workspaceId);
      if (typeof body.method !== "string" || !body.method.trim())
        throw new BridgeError(400, "method is required.");
      const params = object(body.params === undefined ? {} : body.params, "Parameters");
      if (pending.size >= MAX_PENDING_REQUESTS || responses.size >= MAX_PENDING_REQUESTS)
        throw new BridgeError(429, "The bridge queue is full; collect pending responses first.");
      const requestId = randomUUID();
      pending.set(requestId, {
        requestId,
        sessionId: current.sessionId,
        method: body.method,
        params,
        createdAt: now(),
        delivered: false,
      });
      send(request, response, 202, { ok: true, requestId });
      return;
    }
    if (request.method === "GET" && url.pathname === "/response") {
      const requestId = url.searchParams.get("requestId");
      if (!requestId) throw new BridgeError(400, "requestId is required.");
      const current = requireSession(
        request,
        url.searchParams.get("sessionId"),
        url.searchParams.get("workspaceId"),
      );
      if (pending.get(requestId)?.sessionId === current.sessionId) {
        send(request, response, 200, { ok: true, status: "pending" });
        return;
      }
      const completed = responses.get(requestId);
      if (completed?.sessionId !== current.sessionId)
        throw new BridgeError(404, "Agent response was not found.");
      responses.delete(requestId);
      send(request, response, 200, { ...completed.response, status: "complete" });
      return;
    }
    throw new BridgeError(404, "Unknown bridge endpoint.");
  };
  return {
    code,
    clearSession,
    async handleRequest(request, response) {
      try {
        await route(
          request,
          response,
          new URL(request.url ?? "/", `http://${HOST}:${DEFAULT_PORT}`),
        );
      } catch (error) {
        if (response.headersSent) response.destroy();
        else
          send(request, response, error instanceof BridgeError ? error.status : 400, {
            ok: false,
            error: { message: error instanceof Error ? error.message : "Bridge request failed." },
          });
      }
    },
  };
}

export async function startBridge() {
  const bridge = createBridge({
    origins: (process.env.CABANE_AGENT_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  });
  const server = createServer((request, response) => void bridge.handleRequest(request, response));
  server.requestTimeout = 10_000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(DEFAULT_PORT, HOST, resolve);
  });
  console.log(`Cabane agent bridge listening on http://${HOST}:${DEFAULT_PORT}`);
  console.log(`Pairing code: ${bridge.code}`);
  console.log("Open the Cabane editor, enter this code in Agent pilot, then run an agent command.");
  console.log("Examples (run from the repository root):");
  console.log("  npm run agent:request -- --method get_capabilities --pretty");
  console.log("  npm run agent:request -- --method inspect_workspace --pretty");
  console.log("  npm run agent:request -- --method list_catalog --pretty");
  console.log("  npm run agent:request -- --method validate_draft --pretty");
  console.log(
    '  npm run agent:request -- --method execute_action --params \'{"action":{"type":"add-item","modelId":"<modelId>"}}\' --pretty',
  );
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    bridge.clearSession();
    server.close(() => process.exit(0));
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
  await new Promise(() => {});
}
