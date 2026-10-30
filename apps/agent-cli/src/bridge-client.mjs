import { DEFAULT_PORT, HOST } from "./bridge-server.mjs";

export function option(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value.`);
  return value;
}

export function requiredOption(args, name) {
  const value = option(args, name);
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export function baseUrl(args) {
  return (option(args, "--url") ?? `http://${HOST}:${DEFAULT_PORT}`).replace(/\/$/, "");
}

export async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(10_000),
  });
  const body = await response.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("Bridge returned an invalid JSON response.");
  // A completed editor error is an RPC result, distinct from transport errors.
  if (!response.ok || (body.ok === false && body.status !== "complete"))
    throw new Error(body.error?.message ?? `Bridge request failed with HTTP ${response.status}.`);
  return body;
}

export async function requestAgent(args, method, params) {
  const timeoutMs = Number(option(args, "--timeout-ms") ?? 10_000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000)
    throw new Error("--timeout-ms must be an integer from 1 to 30000.");
  if (!params || typeof params !== "object" || Array.isArray(params))
    throw new Error("--params must be a JSON object.");
  const signal = AbortSignal.timeout(timeoutMs);
  const url = baseUrl(args);
  try {
    const status = await fetchJson(`${url}/status`, { signal });
    if (status.protocolVersion !== "2")
      throw new Error("The bridge protocol is incompatible; restart it.");
    if (!status.sessionId) throw new Error("No Cabane editor is paired with the bridge.");
    const queued = await fetchJson(`${url}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: status.sessionId,
        workspaceId: status.workspaceId,
        method,
        params,
      }),
      signal,
    });
    if (typeof queued.requestId !== "string")
      throw new Error("Bridge did not return a request ID.");
    const query = new URLSearchParams({
      requestId: queued.requestId,
      sessionId: status.sessionId,
      workspaceId: status.workspaceId,
    });
    while (!signal.aborted) {
      const result = await fetchJson(`${url}/response?${query}`, { signal });
      if (result.status === "complete") {
        if (!result.ok)
          throw new Error(result.error?.message ?? "The editor rejected the request.");
        return result.result;
      }
      if (result.status !== "pending")
        throw new Error("Bridge returned an invalid request status.");
      await new Promise((resolve) => {
        const finish = () => {
          clearTimeout(timer);
          signal.removeEventListener("abort", finish);
          resolve();
        };
        const timer = setTimeout(finish, 120);
        signal.addEventListener("abort", finish, { once: true });
      });
    }
  } catch (error) {
    if (!signal.aborted) throw error;
  }
  throw new Error(
    "Timed out waiting for the paired Cabane editor. The request may still complete.",
  );
}
