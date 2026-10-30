import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import test from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { withStorageDom } from "./dom-test-environment.mjs";
import { withModules } from "./test-server.mjs";

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const until = async (predicate) => {
  const deadline = performance.now() + 3_000;
  while (!predicate()) {
    assert.ok(performance.now() < deadline, "Bridge condition did not settle");
    await setImmediate();
  }
};

await withModules(async (load) => {
  const { createBrowserBridgeClient } = await load(
    "/apps/web/src/agent-pilot/browser-bridge-client.ts",
  );
  const { useAgentPilotBridge } = await load("/apps/web/src/agent-pilot/browser-bridge.ts");
  const setup = (t, options = {}) => {
    const polls = [],
      answers = [],
      unpaired = [],
      pairings = [],
      connections = [],
      clients = [];
    t.mock.method(globalThis, "fetch", async (url, init) => {
      const path = new URL(url).pathname;
      const body = init?.body ? JSON.parse(init.body) : undefined;
      const respond = (value) => new Response(JSON.stringify(value));
      if (path === "/pair") {
        const result = deferred();
        pairings.push({ ...result, body });
        if (!options.manualPairing)
          result.resolve({ ok: true, sessionId: `session-${pairings.length}` });
        return respond(await result.promise);
      }
      if (path === "/poll") {
        const result = deferred();
        polls.push({ ...result, url });
        // Deliberately ignore AbortSignal: cancellation must also guard late resolved responses.
        return respond(await result.promise);
      }
      if (path === "/respond") {
        answers.push(body);
        if (options.respondStatus)
          return new Response(
            JSON.stringify({ ok: false, error: { message: "Request expired" } }),
            { status: options.respondStatus },
          );
      } else if (path === "/unpair") unpaired.push(body);
      else assert.fail(`Unexpected bridge path ${path}`);
      return respond({ ok: true });
    });
    const client = (execute = async () => ({}), workspaceId = "workspace") => {
      const value = createBrowserBridgeClient({
        workspaceId,
        origin: "https://cabane.test",
        execute,
        onConnection: (connection) => connections.push(connection),
      });
      clients.push(value);
      return value;
    };
    t.after(() => clients.forEach((value) => value.close()));
    return { polls, answers, unpaired, pairings, connections, client };
  };

  test("disconnect and close discard a late pairing response and unpair its original workspace", async (t) => {
    const state = setup(t, { manualPairing: true });
    for (const operation of ["disconnect", "close"]) {
      const client = state.client(undefined, operation);
      const pending = client.pair("MCBN-TEST");
      await until(() => state.pairings.length === (operation === "disconnect" ? 1 : 2));
      client[operation]();
      state.pairings.at(-1).resolve({ ok: true, sessionId: operation });
      await pending;
      await until(() => state.unpaired.some((body) => body.sessionId === operation));
      assert.ok(
        state.unpaired.some(
          (body) => body.sessionId === operation && body.workspaceId === operation,
        ),
      );
    }
    assert.equal(state.polls.length, 0);
    assert.ok(!state.connections.some((connection) => connection.status === "connected"));
  });

  test("workspace pairing requests stay ordered when an old response is slow", async (t) => {
    const state = setup(t, { manualPairing: true });
    const first = state.client(undefined, "first");
    const pendingFirst = first.pair("MCBN-FIRST");
    await until(() => state.pairings.length === 1);
    first.close();
    const second = state.client(undefined, "second");
    const pendingSecond = second.pair("MCBN-SECOND");
    await setImmediate();
    assert.equal(state.pairings.length, 1);
    state.pairings[0].resolve({ ok: true, sessionId: "old" });
    await pendingFirst;
    await until(() => state.pairings.length === 2);
    state.pairings[1].resolve({ ok: true, sessionId: "new" });
    await pendingSecond;
    assert.equal(state.polls.length, 1);
    assert.match(state.polls[0].url, /sessionId=new/);
    assert.ok(
      state.unpaired.some((body) => body.sessionId === "old" && body.workspaceId === "first"),
    );
  });

  test("an in-flight poll cannot execute commands after disconnect", async (t) => {
    const state = setup(t);
    let executed = 0;
    const client = state.client(async () => executed++);
    await client.pair("MCBN-TEST");
    assert.equal(state.polls.length, 1);
    client.disconnect();
    state.polls[0].resolve({
      ok: true,
      requests: [{ requestId: "late", method: "inspect_workspace", params: {} }],
    });
    await setImmediate();
    assert.equal(executed, 0);
    assert.equal(state.answers.length, 0);
  });

  test("commands execute serially and an invalidated batch does not continue", async (t) => {
    const state = setup(t);
    const wait = deferred();
    const started = [];
    let active;
    const client = state.client(async (request, isActive) => {
      active = isActive;
      started.push(request.requestId);
      await wait.promise;
      return { changed: true };
    });
    await client.pair("MCBN-TEST");
    state.polls[0].resolve({
      ok: true,
      requests: ["one", "two"].map((requestId) => ({
        requestId,
        method: "execute_action",
        params: {},
      })),
    });
    await until(() => started.length === 1);
    await setImmediate();
    assert.deepEqual(started, ["one"]);
    assert.equal(active(), true);
    client.disconnect();
    assert.equal(active(), false);
    wait.resolve();
    await setImmediate();
    assert.deepEqual(started, ["one"]);
    assert.equal(state.answers.length, 0);
  });

  test("a re-paired session waits for the previous executor and reads fresh state for each request", async (t) => {
    const state = setup(t);
    const wait = deferred();
    let revision = 0;
    const revisions = [];
    const client = state.client(async (request, isActive) => {
      revisions.push(revision);
      if (request.requestId === "old") await wait.promise;
      if (isActive()) revision++;
      return revision;
    });
    await client.pair("MCBN-TEST");
    state.polls[0].resolve({
      ok: true,
      requests: [{ requestId: "old", method: "execute_action", params: {} }],
    });
    await until(() => revisions.length === 1);
    await client.pair("MCBN-TEST");
    state.polls[1].resolve({
      ok: true,
      requests: ["new-one", "new-two"].map((requestId) => ({
        requestId,
        method: "execute_action",
        params: {},
      })),
    });
    await setImmediate();
    assert.deepEqual(revisions, [0]);
    wait.resolve();
    await until(() => state.answers.length === 2);
    assert.deepEqual(revisions, [0, 0, 1]);
    assert.deepEqual(
      state.answers.map((answer) => answer.response.result),
      [1, 2],
    );
  });

  test("an editor error returns to the agent and the next command still runs", async (t) => {
    const state = setup(t);
    const client = state.client(async (request) => {
      if (request.requestId === "bad") throw new Error("Invalid placement");
      return { accepted: true };
    });
    await client.pair("MCBN-TEST");
    state.polls[0].resolve({
      ok: true,
      requests: ["bad", "good"].map((requestId) => ({
        requestId,
        method: "execute_action",
        params: {},
      })),
    });
    await until(() => state.answers.length === 2);
    assert.deepEqual(
      state.answers.map((answer) => answer.response),
      [
        { ok: false, error: { message: "Invalid placement" } },
        { ok: true, result: { accepted: true } },
      ],
    );
    assert.equal(state.connections.at(-1).status, "connected");
  });

  test("a collected timeout does not disconnect the editor or block the next command", async (t) => {
    const state = setup(t, { respondStatus: 404 });
    const client = state.client();
    await client.pair("MCBN-TEST");
    state.polls[0].resolve({
      ok: true,
      requests: ["expired", "next"].map((requestId) => ({
        requestId,
        method: "inspect_workspace",
        params: {},
      })),
    });
    await until(() => state.answers.length === 2);
    assert.equal(state.connections.at(-1).status, "connected");
  });

  for (const operation of ["discard", "publish"])
    test(`the React bridge stops ${operation} continuations after disconnect`, async (t) => {
      const state = setup(t);
      // Use the shared DOM environment without installing browser members on globalThis.
      await withStorageDom(async ({ window, mount, until }) => {
        const saving = deferred();
        let observed,
          flushing = false,
          published = false;
        const controller = {
          constructEditor: { drawStart: null },
          publishProject: async (_closeAfter, isActive) => {
            assert.equal(isActive(), true);
            flushing = true;
            await saving.promise;
            if (isActive()) published = true;
            return undefined;
          },
          replaceEditorsFromProject: () => {
            published = true;
          },
          workspace: {
            getRecord: () => ({ revision: 1 }),
            resetDraftToPublished: async () => {
              flushing = true;
              return saving.promise;
            },
          },
        };
        function Observe() {
          observed = useAgentPilotBridge("workspace", controller);
          return null;
        }
        await mount(() => {
          const root = createRoot(window.document.createElement("div"));
          root.render(createElement(Observe));
          return { unmount: () => root.unmount() };
        });
        await act(async () => observed.pair("MCBN-TEST"));
        await act(async () =>
          state.polls[0].resolve({
            ok: true,
            requests: [
              {
                requestId: operation,
                method: "execute_action",
                params: { action: { type: `${operation}-draft` } },
              },
            ],
          }),
        );
        await until(() => flushing);
        await act(async () => observed.disconnect());
        await act(async () => saving.resolve({ status: "saved", record: { draft: {} } }));
        assert.equal(published, false);
        assert.equal(state.answers.length, 0);
        assert.equal(observed.connection.status, "disconnected");
      });
    });
});
