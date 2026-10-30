import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import { createBridge } from "../apps/agent-cli/src/bridge-server.mjs";
import { option, requestAgent } from "../apps/agent-cli/src/bridge-client.mjs";

const ORIGIN = "http://127.0.0.1:4173";
const SECOND_ORIGIN = "http://localhost:4173";
const workspaceId = "bridge-fixture";

function fixture(options) {
  const bridge = createBridge(options);
  const send = async (path, body, origin, chunks, requestHeaders = {}) => {
    const request = Readable.from(chunks ?? (body === undefined ? [] : [JSON.stringify(body)]));
    request.method = body === undefined ? "GET" : "POST";
    request.url = path;
    request.headers = { ...requestHeaders, ...(origin === undefined ? {} : { origin }) };
    let status, headers, result;
    const response = {
      headersSent: false,
      writeHead(code, values) {
        status = code;
        headers = values;
        this.headersSent = true;
      },
      end(text) {
        result = JSON.parse(text);
      },
    };
    await bridge.handleRequest(request, response);
    return { status, headers, body: result };
  };
  const pair = async (origin = ORIGIN) =>
    (await send("/pair", { code: bridge.code, workspaceId, origin }, origin)).body.sessionId;
  return { bridge, send, pair };
}

const query = (values) => new URLSearchParams({ workspaceId, ...values });

test("bridge pairs one workspace, delivers each request once and collects results once", async () => {
  const { pair, send } = fixture();
  const sessionId = await pair();
  const { body: queued, status } = await send("/request", {
    sessionId,
    workspaceId,
    method: "inspect_workspace",
    params: {},
  });
  assert.equal(status, 202);
  const poll = () => send(`/poll?${query({ sessionId })}`, undefined, ORIGIN);
  assert.deepEqual((await poll()).body.requests, [
    { requestId: queued.requestId, method: "inspect_workspace", params: {} },
  ]);
  assert.deepEqual((await poll()).body.requests, []);
  const path = `/response?${query({ sessionId, requestId: queued.requestId })}`;
  assert.equal((await send(path)).body.status, "pending");
  await send(
    "/respond",
    {
      sessionId,
      workspaceId,
      requestId: queued.requestId,
      response: { ok: true, result: { revision: 4 } },
    },
    ORIGIN,
  );
  assert.deepEqual((await send(path)).body, {
    status: "complete",
    ok: true,
    result: { revision: 4 },
  });
  assert.equal((await send(path)).status, 404);
});

test("browser origins cannot discover or reuse another editor session", async () => {
  const { pair, send } = fixture();
  const sessionId = await pair();
  assert.equal((await send("/status")).body.sessionId, sessionId);
  assert.equal((await send("/status", undefined, ORIGIN)).body.sessionId, undefined);
  assert.equal(
    (await send("/status", undefined, undefined, undefined, { host: "rebound.test:4317" })).status,
    403,
  );
  assert.equal(
    (await send("/status", undefined, undefined, undefined, { host: "localhost:4317" })).status,
    200,
  );
  for (const origin of [SECOND_ORIGIN, "https://untrusted.test", "null"]) {
    const result = await send(`/poll?${query({ sessionId })}`, undefined, origin);
    assert.ok([401, 403].includes(result.status));
    if (origin !== SECOND_ORIGIN)
      assert.equal(result.headers["Access-Control-Allow-Origin"], undefined);
  }
  assert.equal(
    (await send(`/poll?${query({ sessionId, workspaceId: "other" })}`, undefined, ORIGIN)).status,
    401,
  );
  assert.equal((await send("/pair", { code: "wrong", workspaceId }, ORIGIN)).status, 401);
});

test("re-pairing and unpairing invalidate old sessions and all their queued results", async () => {
  const { pair, send } = fixture();
  const oldSession = await pair();
  const queued = await send("/request", { sessionId: oldSession, method: "inspect_workspace" });
  const sessionId = await pair();
  assert.notEqual(sessionId, oldSession);
  assert.equal(
    (await send(`/poll?${query({ sessionId: oldSession })}`, undefined, ORIGIN)).status,
    401,
  );
  assert.equal(
    (await send(`/response?${query({ sessionId, requestId: queued.body.requestId })}`)).status,
    404,
  );
  // Delayed cleanup for the old session must not disconnect the newly paired editor.
  await send("/unpair", { sessionId: oldSession, workspaceId }, ORIGIN);
  assert.equal((await send("/status")).body.sessionId, sessionId);
  await send(`/unpair?${query({ sessionId })}`, {}, ORIGIN);
  assert.equal((await send("/status")).body.paired, false);
});

test("expiry preserves a timeout instead of accepting a late editor response", async () => {
  let now = 0;
  const { pair, send } = fixture({ now: () => now });
  const sessionId = await pair();
  const queued = await send("/request", { sessionId, method: "inspect_workspace" });
  now = 30_001;
  const late = await send(
    "/respond",
    { sessionId, requestId: queued.body.requestId, response: { ok: true, result: "late" } },
    ORIGIN,
  );
  assert.equal(late.status, 200);
  const answer = await send(`/response?${query({ sessionId, requestId: queued.body.requestId })}`);
  assert.equal(answer.body.ok, false);
  assert.match(answer.body.error.message, /expired/);
  assert.equal((await send(`/poll?${query({ sessionId })}`, undefined, ORIGIN)).status, 200);
});

test("malformed and oversized JSON is rejected without corrupting the bridge", async () => {
  const { pair, send } = fixture();
  const sessionId = await pair();
  for (const body of [null, [], "text", 2])
    assert.equal((await send("/request", body)).status, 400);
  assert.equal((await send("/request", {}, undefined, ["{"])).status, 400);
  assert.equal((await send("/request", {}, undefined, ["x".repeat(128 * 1024 + 1)])).status, 413);
  assert.equal(
    (await send("/request", { sessionId, method: "inspect_workspace", params: [] })).status,
    400,
  );
  assert.equal((await send("/status")).body.sessionId, sessionId);
  // Decode after joining byte chunks, including a UTF-8 character split across chunks.
  const encoded = Buffer.from(
    JSON.stringify({ sessionId, method: "inspect_workspace", params: { name: "é" } }),
  );
  const split = encoded.indexOf(Buffer.from("é")) + 1;
  const queued = await send("/request", {}, undefined, [
    encoded.subarray(0, split),
    encoded.subarray(split),
  ]);
  const polled = await send(`/poll?${query({ sessionId })}`, undefined, ORIGIN);
  assert.equal(queued.status, 202);
  assert.equal(polled.body.requests[0].params.name, "é");
});

test("full workspace responses have a larger bound than command payloads", async () => {
  const { pair, send } = fixture();
  const sessionId = await pair();
  const queued = await send("/request", { sessionId, method: "inspect_workspace" });
  const requestId = queued.body.requestId;
  const oversized = await send(
    "/respond",
    {
      sessionId,
      workspaceId,
      requestId,
      response: { ok: true, result: { project: "x".repeat(8 * 1024 * 1024) } },
    },
    ORIGIN,
  );
  assert.equal(oversized.status, 413);
  const result = { project: { floors: [{ description: "x".repeat(256 * 1024) }] } };
  const accepted = await send(
    "/respond",
    { sessionId, workspaceId, requestId, response: { ok: true, result } },
    ORIGIN,
  );
  assert.equal(accepted.status, 200);
  const answer = await send(`/response?${query({ sessionId, requestId })}`);
  assert.deepEqual(answer.body.result, result);
  assert.equal(
    (await send("/request", { sessionId, method: "execute_action", params: result })).status,
    413,
  );
});

test("the bridge bounds abandoned command queues", async () => {
  const { pair, send } = fixture();
  const sessionId = await pair();
  for (let index = 0; index < 100; index++)
    assert.equal((await send("/request", { sessionId, method: "inspect_workspace" })).status, 202);
  assert.equal((await send("/request", { sessionId, method: "inspect_workspace" })).status, 429);
});

test("CLI rejects invalid options and parameters before contacting the bridge", async () => {
  assert.throws(() => option(["--method", "--pretty"], "--method"), /requires a value/);
  for (const value of ["0", "NaN", "Infinity", "-1", "1.5", "30001"])
    await assert.rejects(
      requestAgent(["--timeout-ms", value], "inspect_workspace", {}),
      /integer from 1 to 30000/,
    );
  for (const params of [null, [], "bad"])
    await assert.rejects(requestAgent([], "inspect_workspace", params), /JSON object/);
});

test("CLI sends session and workspace ownership when collecting success and editor errors", async (t) => {
  const { pair, send } = fixture();
  await pair();
  let answer = { ok: true, result: { revision: 7 } };
  t.mock.method(globalThis, "fetch", async (url, init) => {
    const parsed = new URL(url);
    const body = init?.body ? JSON.parse(init.body) : undefined;
    const result = await send(parsed.pathname + parsed.search, body);
    if (parsed.pathname === "/request" && result.status === 202) {
      assert.equal(body.workspaceId, workspaceId);
      const polled = await send(`/poll?${query({ sessionId: body.sessionId })}`, undefined, ORIGIN);
      await send(
        "/respond",
        {
          sessionId: body.sessionId,
          workspaceId,
          requestId: polled.body.requests[0].requestId,
          response: answer,
        },
        ORIGIN,
      );
    }
    return new Response(JSON.stringify(result.body), { status: result.status });
  });
  assert.deepEqual(await requestAgent([], "inspect_workspace", {}), { revision: 7 });
  answer = { ok: false, error: { message: "Placement was rejected" } };
  await assert.rejects(requestAgent([], "execute_action", {}), /Placement was rejected/);
});
