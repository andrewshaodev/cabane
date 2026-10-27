import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 4317;
const PROTOCOL_VERSION = "1";
const MAX_BODY_BYTES = 128 * 1024;
const REQUEST_TTL_MS = 30_000;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const DEFAULT_ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  "https://smart-cabane.vercel.app",
]);

const state = {
  code: createPairingCode(),
  session: null,
  pending: new Map(),
  responses: new Map(),
};

function createPairingCode() {
  let code = "MCBN-";
  for (const byte of randomBytes(6)) {
    code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return code;
}

function jsonHeaders(request) {
  const origin = request.headers.origin;
  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    ...(typeof origin === "string" && origin
      ? { "Access-Control-Allow-Origin": origin }
      : { "Access-Control-Allow-Origin": "*" }),
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

function allowedOrigins() {
  const configured = process.env.CABANE_AGENT_ORIGINS ?? "";
  return new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...configured
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]);
}

function assertAllowedBrowserOrigin(request) {
  const origin = request.headers.origin;
  if (typeof origin === "string" && origin && !allowedOrigins().has(origin))
    throw new Error(`Browser origin ${origin} is not allowed by this agent bridge.`);
}

function sendJson(request, response, status, body) {
  response.writeHead(status, jsonHeaders(request));
  response.end(JSON.stringify(body));
}

function sendError(request, response, status, message) {
  sendJson(request, response, status, {
    ok: false,
    error: { message },
  });
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function cleanupExpired() {
  const now = Date.now();
  for (const [requestId, item] of state.pending) {
    if (now - item.createdAt <= REQUEST_TTL_MS) continue;
    state.pending.delete(requestId);
    state.responses.set(requestId, {
      createdAt: now,
      response: {
        ok: false,
        error: { message: "The agent request expired before the editor answered." },
      },
    });
  }
  for (const [requestId, item] of state.responses) {
    if (now - item.createdAt > REQUEST_TTL_MS) state.responses.delete(requestId);
  }
}

function clearSession() {
  state.session = null;
  state.pending.clear();
  state.responses.clear();
}

function requireSession(sessionId) {
  if (!state.session || state.session.sessionId !== sessionId) {
    throw new Error("No Cabane editor is paired with this bridge.");
  }
  state.session.lastSeenAt = Date.now();
  return state.session;
}

async function handleRequest(request, response, url) {
  cleanupExpired();
  assertAllowedBrowserOrigin(request);
  if (request.method === "OPTIONS") {
    response.writeHead(204, jsonHeaders(request));
    response.end();
    return;
  }
  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(request, response, 200, { ok: true, protocolVersion: PROTOCOL_VERSION });
    return;
  }
  if (request.method === "GET" && url.pathname === "/status") {
    sendJson(request, response, 200, {
      ok: true,
      protocolVersion: PROTOCOL_VERSION,
      paired: state.session !== null,
      ...(state.session
        ? {
            sessionId: state.session.sessionId,
            workspaceId: state.session.workspaceId,
            origin: state.session.origin,
          }
        : {}),
      pendingCount: state.pending.size,
    });
    return;
  }
  if (request.method === "POST" && url.pathname === "/unpair") {
    const body = await readJson(request);
    const sessionId =
      typeof body.sessionId === "string"
        ? body.sessionId
        : (url.searchParams.get("sessionId") ?? undefined);
    const workspaceId =
      typeof body.workspaceId === "string"
        ? body.workspaceId
        : (url.searchParams.get("workspaceId") ?? undefined);
    if (!sessionId) {
      sendError(request, response, 400, "sessionId is required.");
      return;
    }
    if (state.session?.sessionId === sessionId) {
      if (workspaceId && workspaceId !== state.session.workspaceId) {
        sendError(
          request,
          response,
          401,
          "The unpair workspace does not match the paired workspace.",
        );
        return;
      }
      clearSession();
    }
    sendJson(request, response, 200, { ok: true, paired: false });
    return;
  }
  if (request.method === "POST" && url.pathname === "/pair") {
    const body = await readJson(request);
    if (body.code !== state.code) {
      sendError(request, response, 401, "Pairing code is incorrect.");
      return;
    }
    if (typeof body.workspaceId !== "string" || !body.workspaceId) {
      sendError(request, response, 400, "workspaceId is required.");
      return;
    }
    const session = {
      sessionId: randomUUID(),
      workspaceId: body.workspaceId,
      origin: typeof body.origin === "string" ? body.origin : "unknown",
      pairedAt: Date.now(),
      lastSeenAt: Date.now(),
    };
    clearSession();
    state.session = session;
    sendJson(request, response, 200, {
      ok: true,
      protocolVersion: PROTOCOL_VERSION,
      sessionId: session.sessionId,
    });
    return;
  }
  if (request.method === "GET" && url.pathname === "/poll") {
    try {
      const session = requireSession(url.searchParams.get("sessionId"));
      const workspaceId = url.searchParams.get("workspaceId");
      if (workspaceId && workspaceId !== session.workspaceId)
        throw new Error("The polling workspace does not match the paired workspace.");
      const requests = [...state.pending.values()]
        .filter((item) => item.sessionId === session.sessionId && !item.delivered)
        .slice(0, 4)
        .map((item) => {
          item.delivered = true;
          return {
            requestId: item.requestId,
            method: item.method,
            params: item.params,
          };
        });
      sendJson(request, response, 200, { ok: true, requests });
    } catch (error) {
      sendError(request, response, 401, error.message);
    }
    return;
  }
  if (request.method === "POST" && url.pathname === "/respond") {
    const body = await readJson(request);
    try {
      const session = requireSession(body.sessionId);
      if (body.workspaceId && body.workspaceId !== session.workspaceId)
        throw new Error("The response workspace does not match the paired workspace.");
      const item = state.pending.get(body.requestId);
      if (!item || item.sessionId !== session.sessionId) {
        sendError(request, response, 404, "Agent request was not found.");
        return;
      }
      state.pending.delete(body.requestId);
      state.responses.set(body.requestId, {
        createdAt: Date.now(),
        response: body.response ?? {
          ok: false,
          error: { message: "The editor returned an empty response." },
        },
      });
      sendJson(request, response, 200, { ok: true });
    } catch (error) {
      sendError(request, response, 401, error.message);
    }
    return;
  }
  if (request.method === "POST" && url.pathname === "/request") {
    const body = await readJson(request);
    if (!state.session) {
      sendError(request, response, 409, "Pair an editor before sending agent requests.");
      return;
    }
    const session = requireSession(body.sessionId);
    if (body.workspaceId && body.workspaceId !== session.workspaceId) {
      sendError(
        request,
        response,
        401,
        "The request workspace does not match the paired workspace.",
      );
      return;
    }
    if (typeof body.method !== "string" || !body.method) {
      sendError(request, response, 400, "method is required.");
      return;
    }
    const requestId = randomUUID();
    state.pending.set(requestId, {
      requestId,
      sessionId: session.sessionId,
      method: body.method,
      params: body.params ?? {},
      createdAt: Date.now(),
      delivered: false,
    });
    sendJson(request, response, 202, { ok: true, requestId });
    return;
  }
  if (request.method === "GET" && url.pathname === "/response") {
    const requestId = url.searchParams.get("requestId");
    if (!requestId) {
      sendError(request, response, 400, "requestId is required.");
      return;
    }
    const pending = state.pending.get(requestId);
    if (pending) {
      sendJson(request, response, 200, { ok: true, status: "pending" });
      return;
    }
    const completed = state.responses.get(requestId);
    if (!completed) {
      sendError(request, response, 404, "Agent response was not found.");
      return;
    }
    state.responses.delete(requestId);
    sendJson(request, response, 200, { ok: true, status: "complete", ...completed.response });
    return;
  }
  sendError(request, response, 404, "Unknown bridge endpoint.");
}

async function startBridge() {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://${HOST}:${DEFAULT_PORT}`);
    void handleRequest(request, response, url).catch((error) => {
      if (!response.headersSent) sendError(request, response, 400, error.message);
      else response.destroy();
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(DEFAULT_PORT, HOST, resolve);
  });
  console.log(`Cabane agent bridge listening on http://${HOST}:${DEFAULT_PORT}`);
  console.log(`Pairing code: ${state.code}`);
  console.log("Open the Cabane editor, enter this code in Agent pilot, then run an agent command.");
  console.log("Examples (run from the repository root):");
  console.log("  npm run agent:request -- --method get_capabilities --pretty");
  console.log("  npm run agent:request -- --method inspect_workspace --pretty");
  console.log("  npm run agent:request -- --method list_catalog --pretty");
  console.log("  npm run agent:request -- --method validate_draft --pretty");
  console.log(
    '  npm run agent:request -- --method dispatch_arrange --params \'{"action":{"type":"add-item","modelId":"<modelId>"}}\' --pretty',
  );
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    clearSession();
    server.close(() => process.exit(0));
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
  await new Promise(() => {});
}

function option(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function requiredOption(args, name) {
  const value = option(args, name);
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function baseUrl(args) {
  return (option(args, "--url") ?? `http://${HOST}:${DEFAULT_PORT}`).replace(/\/$/, "");
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    throw new Error(body.error?.message ?? `Bridge request failed with HTTP ${response.status}.`);
  }
  return body;
}

async function requestAgent(args, method, params) {
  const url = baseUrl(args);
  const status = await fetchJson(`${url}/status`);
  if (!status.sessionId) throw new Error("No Cabane editor is paired with the bridge.");
  const queued = await fetchJson(`${url}/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: status.sessionId, method, params }),
  });
  const timeoutMs = Number(option(args, "--timeout-ms") ?? 10_000);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await fetchJson(
      `${url}/response?requestId=${encodeURIComponent(queued.requestId)}`,
    );
    if (result.status === "complete") {
      if (!result.ok) throw new Error(result.error?.message ?? "The editor rejected the request.");
      return result.result;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error("Timed out waiting for the paired Cabane editor.");
}

function printResult(result, args) {
  console.log(JSON.stringify(result, null, args.includes("--pretty") ? 2 : 0));
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "bridge") {
    await startBridge();
    return;
  }
  if (command === "status") {
    printResult(await fetchJson(`${baseUrl(args)}/status`), args);
    return;
  }
  if (command === "inspect") {
    printResult(await requestAgent(args, "inspect_workspace", {}), args);
    return;
  }
  if (command === "validate") {
    printResult(await requestAgent(args, "validate_draft", {}), args);
    return;
  }
  if (command === "undo" || command === "redo") {
    printResult(await requestAgent(args, command, {}), args);
    return;
  }
  if (command === "rename-room") {
    const params = {
      roomId: requiredOption(args, "--room-id"),
      name: requiredOption(args, "--name"),
      ...(option(args, "--floor-id") ? { floorId: option(args, "--floor-id") } : {}),
      ...(option(args, "--expected-revision")
        ? { expectedRevision: Number(option(args, "--expected-revision")) }
        : {}),
    };
    printResult(await requestAgent(args, "rename_room", params), args);
    return;
  }
  if (command === "request") {
    const method = requiredOption(args, "--method");
    const paramsText = option(args, "--params") ?? "{}";
    let params;
    try {
      params = JSON.parse(paramsText);
    } catch {
      throw new Error("--params must be valid JSON.");
    }
    printResult(await requestAgent(args, method, params), args);
    return;
  }
  console.log(`Usage:
  cabane-agent bridge
  cabane-agent status [--url http://127.0.0.1:4317]
  cabane-agent inspect [--pretty]
  cabane-agent validate [--pretty]
  cabane-agent rename-room --room-id ROOM_ID --name "New name"
  cabane-agent undo | redo
  cabane-agent request --method METHOD --params '{"key":"value"}'

Methods include get_capabilities, inspect_workspace, get_draft_diff, validate_draft,
select_floor, dispatch_construct, floor_operation, list_catalog, dispatch_arrange,
list_binding_slots, apply_binding, apply_room_mapping, discard_draft, publish_draft,
rename_room, undo and redo.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
