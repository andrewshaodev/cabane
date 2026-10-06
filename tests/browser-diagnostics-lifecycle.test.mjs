import assert from "node:assert/strict";
import test from "node:test";
import { withBrowserDiagnostics, registerBrowserDiagnostics } from "./browser-test-diagnostics.mjs";

function context(aborted = false) {
  const hooks = [];
  return {
    name: "lifecycle fixture",
    signal: { aborted },
    after: (hook) => hooks.push(hook),
    hooks,
  };
}

test("diagnostics captures all sessions before cleanup and preserves the original failure", async (testContext) => {
  const diagnostics = [];
  testContext.mock.method(process.stderr, "write", (message) => {
    diagnostics.push(message);
    return true;
  });
  const t = context();
  const calls = [];
  const failure = new Error("original failure");
  await assert.rejects(
    withBrowserDiagnostics(async () => {
      registerBrowserDiagnostics({
        capture: async () => {
          calls.push("capture 1");
          throw Error("capture unavailable");
        },
        dispose: async () => {
          calls.push("dispose 1");
          throw Error("cleanup unavailable");
        },
      });
      registerBrowserDiagnostics({
        capture: async () => calls.push("capture 2"),
        dispose: async () => calls.push("dispose 2"),
      });
      throw failure;
    })(t),
    (error) => error === failure,
  );
  await t.hooks[0]();
  assert.deepEqual(calls, ["capture 1", "capture 2", "dispose 1", "dispose 2"]);
  assert.match(diagnostics.join(""), /capture unavailable/);
  assert.match(diagnostics.join(""), /cleanup unavailable/);
});

test("successful callbacks discard evidence and clean up exactly once", async () => {
  const t = context();
  const calls = [];
  await withBrowserDiagnostics(async () => {
    registerBrowserDiagnostics({
      capture: async () => calls.push("capture"),
      dispose: async () => calls.push("dispose"),
    });
  })(t);
  await t.hooks[0]();
  assert.deepEqual(calls, ["dispose"]);
  assert.equal(registerBrowserDiagnostics({}), false);
});

test("aborted callbacks capture evidence and cleanup failures fail an otherwise passing test", async () => {
  const t = context(true);
  const calls = [];
  await withBrowserDiagnostics(async () => {
    registerBrowserDiagnostics({
      capture: async (_name, error) => calls.push(error.message),
      dispose: async () => calls.push("dispose"),
    });
  })(t);
  assert.deepEqual(calls, ["Test aborted", "dispose"]);
  await assert.rejects(
    withBrowserDiagnostics(async () => {
      registerBrowserDiagnostics({
        dispose: async () => {
          throw Error("cannot close");
        },
      });
    })(context()),
    /Browser session cleanup failed/,
  );
});
