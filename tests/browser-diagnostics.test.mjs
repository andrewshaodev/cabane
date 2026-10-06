import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { readFile, readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";
import { createBrowserTestSession } from "./browser-test-environment.mjs";

test(
  "browser failure retains readable errors, screenshot and trace before teardown",
  { timeout: 30_000 },
  async () => {
    const environment = { ...process.env };
    delete environment.NODE_TEST_CONTEXT;
    delete environment.CABANE_TEST_SHARED_MODULES;
    const child = spawn(
      process.execPath,
      [
        "--test",
        "--test-reporter=./scripts/agent-test-reporter.mjs",
        "tests/fixtures/browser-diagnostics-probe.mjs",
      ],
      { env: environment },
    );
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    let directory;
    try {
      assert.equal(await new Promise((resolve) => child.on("close", resolve)), 1, output);
      directory = output.match(/Browser failure artifacts: ([^\n]+)/)?.[1];
      assert.ok(directory, output);
      assert.ok(directory.startsWith(resolve("test-results/browser") + "/"));
      const files = await readdir(directory);
      assert.ok(files.includes("context-1-page-1.png"));
      assert.ok(files.includes("context-1-trace.zip"));
      assert.deepEqual(
        (await readFile(join(directory, "context-1-page-1.png"))).subarray(0, 8),
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      assert.equal(
        (await readFile(join(directory, "context-1-trace.zip"))).subarray(0, 2).toString(),
        "PK",
      );
      const report = JSON.parse(await readFile(join(directory, "errors.json"), "utf8"));
      assert.match(report.error, /intentional assertion failure/);
      assert.ok(
        report.messages.some(
          (message) =>
            message.type === "error" && message.text.includes("diagnostic console error"),
        ),
      );
      assert.ok(
        report.messages.some(
          (message) =>
            message.type === "pageerror" && message.text.includes("diagnostic page error"),
        ),
      );
      assert.deepEqual(report.captureErrors, []);
      assert.match(output, /Rerun:.*browser-diagnostics-probe.mjs/);
    } finally {
      child.kill();
      if (directory) await rm(directory, { recursive: true, force: true });
    }
  },
);

test("successful browser sessions remain isolated and close at callback completion", async (t) => {
  let first;
  let second;
  await withBrowserDiagnostics(async () => {
    const session = await createBrowserTestSession();
    first = await session.newPage();
    second = await session.newPage();
    assert.notEqual(first.context(), second.context());
    assert.equal(first.context().browser(), second.context().browser());
    await session.close();
    assert.equal(first.isClosed(), false);
  })(t);
  assert.equal(first.isClosed(), true);
  assert.equal(second.isClosed(), true);
});
